import fs from 'fs';

function findUsersInSql(filePath: string) {
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf16le');
    
    console.log(`\n=== Checking: ${filePath} ===`);
    
    // Look for users table creation
    const tableIndex = content.indexOf('CREATE TABLE public.users');
    if (tableIndex !== -1) {
      console.log(`Found 'CREATE TABLE public.users' in this file!`);
    }

    // Look for COPY public.users
    const copyIndex = content.indexOf('COPY public.users');
    if (copyIndex !== -1) {
      console.log(`Found 'COPY public.users' data starting at index ${copyIndex}!`);
      // Get the next few lines
      const slice = content.substring(copyIndex, copyIndex + 2000);
      console.log("Slice of data:\n", slice);
    } else {
      // Look for INSERT INTO public.users or INSERT INTO users
      const insertIndex = content.indexOf('INSERT INTO public.users');
      if (insertIndex !== -1) {
        console.log(`Found 'INSERT INTO public.users'!`);
        console.log(content.substring(insertIndex, insertIndex + 2000));
      } else {
        const altInsert = content.indexOf('INSERT INTO users');
        if (altInsert !== -1) {
          console.log(`Found 'INSERT INTO users'!`);
          console.log(content.substring(altInsert, altInsert + 2000));
        } else {
          console.log("No COPY or INSERT found for users table in this file.");
        }
      }
    }
  } catch (e: any) {
    console.log(`Error reading ${filePath}: ${e.message}`);
  }
}

findUsersInSql('c:\\SALAOPROMANAGER\\backup_clean.sql');
findUsersInSql('c:\\SALAOPROMANAGER\\backup_db.sql');
findUsersInSql('c:\\SALAOPROMANAGER\\backup_db_utf8.sql');
findUsersInSql('c:\\SALAOPROMANAGER\\backup_full.sql');
