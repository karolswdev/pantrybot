// Test what the regex actually captures
const ifMatch = '"invalid-etag"';
const versionMatch = ifMatch.match(/^(?:W\/)?"([^"]+)"$/);
console.log('ifMatch:', ifMatch);
console.log('versionMatch:', versionMatch);
if (versionMatch) {
  console.log('Captured value:', versionMatch[1]);
  console.log('Is it "invalid-etag"?', versionMatch[1] === 'invalid-etag');
  const clientVersion = parseInt(versionMatch[1]);
  console.log('clientVersion:', clientVersion);
  console.log('isNaN(clientVersion):', isNaN(clientVersion));
}
