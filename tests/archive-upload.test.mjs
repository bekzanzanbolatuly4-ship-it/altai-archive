import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolveUploadType} from '../lib/archive-upload.ts';

test('upload type resolution requires an allowed, matching MIME and extension',()=>{
 assert.equal(resolveUploadType('application/pdf','record.pdf')?.mime,'application/pdf');
 assert.equal(resolveUploadType('image/jpeg','scan.jpeg')?.mime,'image/jpeg');
 assert.equal(resolveUploadType('image/pjpeg','scan.jpg')?.mime,'image/jpeg');
 assert.equal(resolveUploadType('image/png','scan.jpg'),null);
 assert.equal(resolveUploadType('application/pdf','record.exe'),null);
 assert.equal(resolveUploadType('application/octet-stream','record.pdf'),null);
 assert.equal(resolveUploadType('image/jpeg','scan'),null);
});
