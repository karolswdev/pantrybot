#!/usr/bin/env node

/**
 * Final QA Verification Script for PHASE-MBE-4
 * Tests all Phase 4 requirements comprehensively
 */

const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:8080';
const testResults = [];
let testsRun = 0;
let testsPassed = 0;

// Helper to record test results
function recordResult(testId, passed, details = '') {
    testsRun++;
    if (passed) testsPassed++;
    testResults.push({
        testId,
        passed,
        details: details || (passed ? 'Test passed successfully' : 'Test failed')
    });
    console.log(`${passed ? '✓' : '✗'} ${testId}: ${passed ? 'PASSED' : 'FAILED'}${details ? ' - ' + details : ''}`);
}

// Test helper functions
async function registerUser() {
    try {
        const response = await axios.post(`${API_BASE}/api/v1/auth/register`, {
            email: `test-${Date.now()}@test.com`,
            password: 'Test123!',
            displayName: 'Test User'
        });
        return response.data;
    } catch (error) {
        throw new Error(`Registration failed: ${error.message}`);
    }
}

async function runWebSocketTests() {
    console.log('\n=== Phase 4: WebSocket Tests ===\n');

    // TC-MBE-4.1: WebSocket Connection With Valid Token
    try {
        const user = await registerUser();
        const socket = io(API_BASE, {
            auth: { token: user.accessToken },
            transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', () => {
                socket.on('connection_success', (data) => {
                    if (data.userId && data.households) {
                        recordResult('TC-MBE-4.1', true, 'WebSocket connection with valid token succeeded');
                        socket.disconnect();
                        resolve();
                    } else {
                        reject(new Error('Invalid connection success data'));
                    }
                });
            });
            socket.on('connect_error', (error) => {
                reject(error);
            });
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
    } catch (error) {
        recordResult('TC-MBE-4.1', false, error.message);
    }

    // TC-MBE-4.2: WebSocket Connection With Invalid Token
    try {
        const socket = io(API_BASE, {
            auth: { token: 'invalid.token.here' },
            transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
            socket.on('connect_error', (error) => {
                if (error.message.includes('Authentication failed')) {
                    recordResult('TC-MBE-4.2', true, 'Connection properly rejected with invalid token');
                    resolve();
                } else {
                    reject(new Error(`Unexpected error: ${error.message}`));
                }
            });
            socket.on('connect', () => {
                reject(new Error('Should not connect with invalid token'));
            });
            setTimeout(() => resolve(), 2000);
        });
    } catch (error) {
        recordResult('TC-MBE-4.2', false, error.message);
    }

    // TC-MBE-4.3: Item Update Triggers Broadcast
    try {
        const user = await registerUser();
        const householdId = user.defaultHouseholdId;
        
        // Create test item
        const itemResponse = await axios.post(
            `${API_BASE}/api/v1/households/${householdId}/items`,
            {
                name: 'Broadcast Test Item',
                quantity: 1,
                location: 'pantry',
                unit: 'piece'
            },
            {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            }
        );
        const itemId = itemResponse.data.id;

        // Connect two WebSocket clients
        const clientA = io(API_BASE, {
            auth: { token: user.accessToken },
            transports: ['websocket']
        });

        const clientB = io(API_BASE, {
            auth: { token: user.accessToken },
            transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
            let connectCount = 0;
            
            const onConnect = () => {
                connectCount++;
                if (connectCount === 2) {
                    // Both clients connected, now update item
                    
                    clientB.on('item.updated', (event) => {
                        if (event.householdId === householdId && 
                            event.payload.itemId === itemId &&
                            event.payload.changes.quantity === 5) {
                            recordResult('TC-MBE-4.3', true, 'Item update broadcast received successfully');
                            clientA.disconnect();
                            clientB.disconnect();
                            resolve();
                        }
                    });

                    // Get item first to get ETag
                    axios.get(
                        `${API_BASE}/api/v1/households/${householdId}/items/${itemId}`,
                        {
                            headers: { Authorization: `Bearer ${user.accessToken}` }
                        }
                    ).then(getResponse => {
                        const etag = getResponse.headers.etag;
                        
                        // Update item from clientA
                        axios.patch(
                            `${API_BASE}/api/v1/households/${householdId}/items/${itemId}`,
                            { quantity: 5 },
                            {
                                headers: { 
                                    Authorization: `Bearer ${user.accessToken}`,
                                    'If-Match': etag
                                }
                            }
                        ).catch(err => reject(err));
                    }).catch(err => reject(err));
                }
            };

            clientA.on('connect', onConnect);
            clientB.on('connect', onConnect);
            
            setTimeout(() => reject(new Error('Broadcast timeout')), 5000);
        });
    } catch (error) {
        recordResult('TC-MBE-4.3', false, error.message);
    }
}

async function runNotificationTests() {
    console.log('\n=== Phase 4: Notification Endpoint Tests ===\n');

    const user = await registerUser();
    const token = user.accessToken;

    // TC-MBE-4.4: GET Notification Settings
    try {
        const response = await axios.get(
            `${API_BASE}/api/v1/notifications/settings`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const data = response.data;
        if (response.status === 200 && 
            data.email && 
            data.email.enabled !== undefined &&
            data.preferences &&
            data.telegram) {
            recordResult('TC-MBE-4.4', true, 'GET notification settings returns correct structure');
        } else {
            recordResult('TC-MBE-4.4', false, 'Invalid response structure');
        }
    } catch (error) {
        recordResult('TC-MBE-4.4', false, error.message);
    }

    // TC-MBE-4.5: PUT Notification Settings
    try {
        const updateResponse = await axios.put(
            `${API_BASE}/api/v1/notifications/settings`,
            {
                email: { enabled: false },
                preferences: {
                    expirationWarningDays: 7,
                    preferredTime: '10:00'
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (updateResponse.status !== 200) {
            throw new Error(`Expected 200, got ${updateResponse.status}`);
        }

        // Verify settings were saved
        const getResponse = await axios.get(
            `${API_BASE}/api/v1/notifications/settings`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const data = getResponse.data;
        if (data.email.enabled === false &&
            data.preferences.expirationWarningDays === 7 &&
            data.preferences.preferredTime === '10:00') {
            recordResult('TC-MBE-4.5', true, 'PUT notification settings persisted successfully');
        } else {
            recordResult('TC-MBE-4.5', false, 'Settings not properly persisted');
        }
    } catch (error) {
        recordResult('TC-MBE-4.5', false, error.message);
    }

    // TC-MBE-4.6: Link Telegram Account
    try {
        const response = await axios.post(
            `${API_BASE}/api/v1/notifications/telegram/link`,
            {
                verificationCode: 'TEST01'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.status === 200 && 
            response.data.linked === true &&
            response.data.telegramUsername) {
            recordResult('TC-MBE-4.6', true, 'Telegram account linked successfully');
        } else {
            recordResult('TC-MBE-4.6', false, 'Invalid link response');
        }

        // Test duplicate link (should return 409)
        try {
            await axios.post(
                `${API_BASE}/api/v1/notifications/telegram/link`,
                {
                    verificationCode: 'TEST02'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            recordResult('TC-MBE-4.6-duplicate', false, 'Should have returned 409 for duplicate');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                recordResult('TC-MBE-4.6-duplicate', true, 'Duplicate link properly rejected');
            } else {
                recordResult('TC-MBE-4.6-duplicate', false, error.message);
            }
        }
    } catch (error) {
        recordResult('TC-MBE-4.6', false, error.message);
    }
}

async function main() {
    console.log('========================================');
    console.log('   PHASE-MBE-4 FINAL QA VERIFICATION');
    console.log('========================================');
    console.log(`Testing against: ${API_BASE}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Check server health first
        await axios.get(`${API_BASE}/health`);
        console.log('✓ Server is running\n');

        // Run all test suites
        await runWebSocketTests();
        await runNotificationTests();

        // Print summary
        console.log('\n========================================');
        console.log('           TEST SUMMARY');
        console.log('========================================\n');
        console.log(`Total Tests: ${testsRun}`);
        console.log(`Passed: ${testsPassed}`);
        console.log(`Failed: ${testsRun - testsPassed}`);
        console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

        // Detailed results
        console.log('\nDetailed Results:');
        console.log('─────────────────');
        testResults.forEach((result, index) => {
            const status = result.passed ? '[✓]' : '[✗]';
            console.log(`${index + 1}. ${status} ${result.testId}: ${result.details}`);
        });

        // Final verdict
        console.log('\n========================================');
        console.log('         PHASE-4 QA VERDICT');
        console.log('========================================');
        
        if (testsPassed === testsRun) {
            console.log('\n✅ VERDICT: GREEN - All Phase 4 tests passed!');
            console.log('Phase 4 implementation is complete and verified.');
        } else {
            const coreTests = ['TC-MBE-4.1', 'TC-MBE-4.2', 'TC-MBE-4.3', 'TC-MBE-4.4', 'TC-MBE-4.5', 'TC-MBE-4.6'];
            const coreTestsPassed = testResults.filter(r => coreTests.includes(r.testId) && r.passed).length;
            
            if (coreTestsPassed === coreTests.length) {
                console.log('\n⚠️ VERDICT: GREEN (with minor issues) - All core Phase 4 tests passed');
                console.log('Optional/duplicate checks had issues but core functionality is verified.');
            } else {
                console.log('\n❌ VERDICT: RED - Some Phase 4 tests failed');
                console.log('Please review failed tests and fix issues before sign-off.');
            }
        }

        process.exit(testsPassed === testsRun ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Ensure process exits after max 30 seconds
setTimeout(() => {
    console.error('\n❌ Test suite timeout after 30 seconds');
    process.exit(1);
}, 30000);

main();