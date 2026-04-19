import sqlite3

try:
    conn = sqlite3.connect('hostel.db')
    cur = conn.cursor()

    # 1. Check existing columns on students table
    cur.execute('PRAGMA table_info(students)')
    cols = [row[1] for row in cur.fetchall()]
    print('Existing student columns:', cols)

    # 2. Add essl_uid if missing
    if 'essl_uid' not in cols:
        cur.execute('ALTER TABLE students ADD COLUMN essl_uid INTEGER')
        print('Added essl_uid to students table.')
    else:
        print('essl_uid already exists.')
        
    if 'address' not in cols:
        cur.execute('ALTER TABLE students ADD COLUMN address TEXT')
        print('Added address to students table.')
    else:
        print('address already exists.')
        
    if 'parent_contact_no' not in cols:
        cur.execute('ALTER TABLE students ADD COLUMN parent_contact_no VARCHAR(20)')
        print('Added parent_contact_no to students table.')
    else:
        print('parent_contact_no already exists.')

    # 3. Create device_config table if missing
    cur.execute('''
        CREATE TABLE IF NOT EXISTS device_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address VARCHAR(50) NOT NULL DEFAULT "192.168.1.201",
            port INTEGER NOT NULL DEFAULT 4370,
            status VARCHAR(20) DEFAULT "unknown",
            last_sync DATETIME,
            device_serial VARCHAR(100),
            firmware_version VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print('Ensured device_config table exists.')

    # 4. Seed default row if empty
    cur.execute('SELECT COUNT(*) FROM device_config')
    if cur.fetchone()[0] == 0:
        cur.execute("INSERT INTO device_config (ip_address, port, status) VALUES ('192.168.1.201', 4370, 'unknown')")
        print('Inserted default device_config row.')

    conn.commit()
    conn.close()
    print('Migration completed successfully.')
except Exception as e:
    print('Error during migration:', e)
