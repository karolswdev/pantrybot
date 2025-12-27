import '@testing-library/jest-dom';

// Mock ResizeObserver for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock SpeechRecognition for voice input tests
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
  }

  start() {
    if (this.onstart) {
      this.onstart(new Event('start'));
    }
  }

  stop() {
    if (this.onend) {
      this.onend(new Event('end'));
    }
  }

  abort() {
    if (this.onend) {
      this.onend(new Event('end'));
    }
  }

  // Helper methods for testing
  simulateResult(transcript, isFinal = true, confidence = 0.9) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [{
          isFinal,
          0: { transcript, confidence },
          length: 1,
        }],
      };
      this.onresult(event);
    }
  }

  simulateError(error) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

global.SpeechRecognition = MockSpeechRecognition;
global.webkitSpeechRecognition = MockSpeechRecognition;