import fs from 'fs';

function inspectFile(filePath: string) {
  try {
    const buffer = fs.readFileSync(filePath);
    console.log(`\n=== File: ${filePath} ===`);
    console.log(`Size: ${buffer.length} bytes`);
    
    // Check if it's UTF-16LE
    const utf16String = buffer.toString('utf16le');
    if (utf16String.includes('PostgreSQL') || utf16String.includes('CREATE') || utf16String.includes('users')) {
      console.log("Detected: UTF-16LE");
      console.log(utf16String.substring(0, 1000));
      return;
    }
    
    // Try UTF-8
    const utf8String = buffer.toString('utf8');
    console.log("Detected: UTF-8 / ASCII");
    console.log(utf8String.substring(0, 1000));
  } catch (e: any) {
    console.log(`Failed to read ${filePath}: ${e.message}`);
  }
}

inspectFile('c:\\SALAOPROMANAGER\\backup_clean.sql');
inspectFile('c:\\SALAOPROMANAGER\\backup_db.sql');
inspectFile('c:\\SALAOPROMANAGER\\backup_db_utf8.sql');
inspectFile('c:\\SALAOPROMANAGER\\backup_full.sql');
