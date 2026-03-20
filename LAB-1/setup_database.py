"""
MedAssist AI - Database Setup
Creates and populates the SQLite database with sample data
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

def setup_database():
    """Create database and populate with sample data"""
    
    # Ensure database directory exists
    os.makedirs('database', exist_ok=True)
    
    db_path = 'database/medassist.db'
    
    # Remove existing database for clean setup
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("[*] Creating database schema...")
    
    # Create Users table
    cursor.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Patients table
    cursor.execute("""
        CREATE TABLE patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dob DATE NOT NULL,
            ssn TEXT,
            address TEXT,
            phone TEXT,
            insurance_id TEXT,
            emergency_contact TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Medical Records table
    cursor.execute("""
        CREATE TABLE medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            content TEXT,
            provider TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            diagnosis_code TEXT,
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    # Create Lab Results table
    cursor.execute("""
        CREATE TABLE lab_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            test_name TEXT NOT NULL,
            result TEXT,
            reference_range TEXT,
            status TEXT,
            test_date DATE,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    # Create Providers table
    cursor.execute("""
        CREATE TABLE providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT,
            schedule TEXT,
            email TEXT,
            phone TEXT
        )
    """)
    
    # Create Appointments table
    cursor.execute("""
        CREATE TABLE appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            provider_id TEXT NOT NULL,
            datetime TIMESTAMP NOT NULL,
            type TEXT,
            status TEXT DEFAULT 'scheduled',
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (provider_id) REFERENCES providers(id)
        )
    """)
    
    # Create Billing table
    cursor.execute("""
        CREATE TABLE billing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            service TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            date DATE,
            insurance_claim_id TEXT,
            notes TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    # Create Payment Log table
    cursor.execute("""
        CREATE TABLE payment_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            amount DECIMAL(10,2),
            method TEXT,
            card_last_four TEXT,
            timestamp TIMESTAMP,
            raw_data TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    # Create Refunds table
    cursor.execute("""
        CREATE TABLE refunds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            amount DECIMAL(10,2),
            reason TEXT,
            status TEXT DEFAULT 'pending',
            processed_at TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )
    """)
    
    print("[*] Inserting sample data...")
    
    # Insert Users (with intentionally weak passwords for lab)
    users = [
        ('patient1', 'patient123', 'patient', 'John Patient', 'patient1@email.com'),
        ('patient2', 'patient123', 'patient', 'Jane Patient', 'patient2@email.com'),
        ('nurse_jones', 'nurse123', 'nurse', 'Nancy Jones', 'njones@medassist.com'),
        ('nurse_smith', 'nurse456', 'nurse', 'Steve Smith', 'ssmith@medassist.com'),
        ('dr_smith', 'doctor123', 'doctor', 'Dr. James Smith', 'jsmith@medassist.com'),
        ('dr_johnson', 'doctor456', 'doctor', 'Dr. Lisa Johnson', 'ljohnson@medassist.com'),
        ('admin', 'admin123', 'admin', 'System Admin', 'admin@medassist.com'),
        ('superadmin', 'SuperAdmin123!', 'superadmin', 'Super Administrator', 'superadmin@medassist.com')
    ]
    
    cursor.executemany(
        "INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)",
        users
    )
    
    # Insert Patients (with sensitive PII - for lab purposes only)
    patients = [
        ('John Smith', '1975-03-15', '123-45-6789', '123 Main Street, Boston, MA 02101', '555-0101', 'BC-887721'),
        ('Sarah Johnson', '1988-07-22', '234-56-7890', '456 Oak Avenue, Cambridge, MA 02139', '555-0102', 'AET-556633'),
        ('Michael Williams', '1962-11-30', '345-67-8901', '789 Pine Road, Somerville, MA 02143', '555-0103', 'MED-1234567890'),
        ('Emily Davis', '1995-02-14', '456-78-9012', '321 Elm Street, Boston, MA 02102', '555-0104', 'UHC-998877'),
        ('Robert Brown', '1950-08-08', '567-89-0123', '654 Maple Lane, Brookline, MA 02445', '555-0105', 'MA-5544332211'),
        ('Jennifer Wilson', '1983-12-03', '678-90-1234', '987 Cedar Blvd, Newton, MA 02458', '555-0106', 'CIG-112233'),
        ('David Miller', '1970-06-18', '789-01-2345', '147 Birch Drive, Wellesley, MA 02481', '555-0107', 'BC-445566'),
        ('Lisa Anderson', '1992-09-25', '890-12-3456', '258 Spruce Way, Lexington, MA 02420', '555-0108', 'AET-778899'),
        ('James Taylor', '1968-04-11', '901-23-4567', '369 Willow Court, Arlington, MA 02474', '555-0109', 'MED-9876543210'),
        ('Maria Garcia', '1985-01-28', '012-34-5678', '741 Ash Lane, Medford, MA 02155', '555-0110', 'UHC-334455')
    ]
    
    cursor.executemany(
        "INSERT INTO patients (name, dob, ssn, address, phone, insurance_id) VALUES (?, ?, ?, ?, ?, ?)",
        patients
    )
    
    # Insert Providers
    providers = [
        ('DR001', 'Dr. James Smith', 'General Practice', 'Mon-Fri 9am-5pm', 'jsmith@medassist.com', '555-0201'),
        ('DR002', 'Dr. Lisa Johnson', 'Cardiology', 'Tue-Thu 10am-4pm', 'ljohnson@medassist.com', '555-0202'),
        ('DR003', 'Dr. Robert Williams', 'Pediatrics', 'Mon-Wed-Fri 8am-3pm', 'rwilliams@medassist.com', '555-0203'),
        ('DR004', 'Dr. Emily Chen', 'Dermatology', 'Mon-Thu 9am-4pm', 'echen@medassist.com', '555-0204'),
        ('DR005', 'Dr. Michael Brown', 'Orthopedics', 'Wed-Fri 10am-6pm', 'mbrown@medassist.com', '555-0205')
    ]
    
    cursor.executemany(
        "INSERT INTO providers (id, name, specialty, schedule, email, phone) VALUES (?, ?, ?, ?, ?, ?)",
        providers
    )
    
    # Insert Medical Records
    records = [
        (1, 'diagnosis', 'Type 2 Diabetes Mellitus', 'Dr. Smith', 'E11.9', 'Started on Metformin'),
        (1, 'prescription', 'Metformin 500mg - Take twice daily with meals', 'Dr. Smith', None, 'Refills: 3'),
        (1, 'lab', 'HbA1c: 7.2% (Target: <7.0%)', 'Lab Corp', None, 'Follow up in 3 months'),
        (2, 'diagnosis', 'Essential Hypertension', 'Dr. Johnson', 'I10', 'Family history positive'),
        (2, 'prescription', 'Lisinopril 10mg - Take once daily', 'Dr. Johnson', None, 'Monitor BP weekly'),
        (3, 'diagnosis', 'COPD with Anxiety', 'Dr. Smith', 'J44.9, F41.1', 'Former smoker, quit 2020'),
        (3, 'prescription', 'Albuterol inhaler - Use as needed', 'Dr. Smith', None, 'Avoid triggers'),
        (3, 'prescription', 'Alprazolam 0.5mg - Take as needed for anxiety', 'Dr. Smith', None, 'Schedule IV controlled'),
        (4, 'diagnosis', 'Generalized Anxiety Disorder', 'Dr. Chen', 'F41.1', 'Work-related stress'),
        (4, 'prescription', 'Sertraline 50mg - Take once daily', 'Dr. Chen', None, 'Increase to 100mg if needed'),
        (5, 'diagnosis', 'Atrial Fibrillation, CHF', 'Dr. Johnson', 'I48.91, I50.9', 'High fall risk'),
        (5, 'prescription', 'Warfarin 5mg - Take once daily', 'Dr. Johnson', None, 'Weekly INR checks'),
        (5, 'prescription', 'Metoprolol 25mg - Take twice daily', 'Dr. Johnson', None, 'HR target: 60-80')
    ]
    
    cursor.executemany(
        "INSERT INTO medical_records (patient_id, type, content, provider, diagnosis_code, notes) VALUES (?, ?, ?, ?, ?, ?)",
        records
    )
    
    # Insert Lab Results
    lab_results = [
        (1, 'HbA1c', '7.2%', '4.0-5.6%', 'abnormal', '2024-11-28'),
        (1, 'Fasting Glucose', '142 mg/dL', '70-100 mg/dL', 'abnormal', '2024-11-28'),
        (1, 'Cholesterol', '215 mg/dL', '<200 mg/dL', 'abnormal', '2024-11-28'),
        (2, 'Blood Pressure', '138/88 mmHg', '<120/80 mmHg', 'abnormal', '2024-11-15'),
        (2, 'Potassium', '4.2 mEq/L', '3.5-5.0 mEq/L', 'normal', '2024-11-15'),
        (3, 'Spirometry FEV1', '68%', '>80%', 'abnormal', '2024-12-01'),
        (5, 'INR', '2.5', '2.0-3.0', 'normal', '2024-11-30'),
        (5, 'BNP', '450 pg/mL', '<100 pg/mL', 'abnormal', '2024-11-30')
    ]
    
    cursor.executemany(
        "INSERT INTO lab_results (patient_id, test_name, result, reference_range, status, test_date) VALUES (?, ?, ?, ?, ?, ?)",
        lab_results
    )
    
    # Insert Appointments
    today = datetime.now()
    appointments = [
        (1, 'DR001', (today + timedelta(days=7)).strftime('%Y-%m-%d 10:00'), 'follow-up', 'scheduled'),
        (2, 'DR002', (today + timedelta(days=3)).strftime('%Y-%m-%d 14:00'), 'cardiology', 'scheduled'),
        (3, 'DR001', (today + timedelta(days=1)).strftime('%Y-%m-%d 09:00'), 'urgent', 'scheduled'),
        (4, 'DR004', (today + timedelta(days=14)).strftime('%Y-%m-%d 11:00'), 'dermatology', 'scheduled'),
        (5, 'DR002', (today + timedelta(days=2)).strftime('%Y-%m-%d 15:30'), 'cardiology', 'scheduled'),
        (1, 'DR001', (today - timedelta(days=30)).strftime('%Y-%m-%d 10:00'), 'follow-up', 'completed'),
        (2, 'DR002', (today - timedelta(days=14)).strftime('%Y-%m-%d 14:00'), 'initial', 'completed')
    ]
    
    cursor.executemany(
        "INSERT INTO appointments (patient_id, provider_id, datetime, type, status) VALUES (?, ?, ?, ?, ?)",
        appointments
    )
    
    # Create Hidden Flags table (must be discovered through exploitation)
    cursor.execute("""
        CREATE TABLE secret_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_name TEXT NOT NULL,
            token_value TEXT NOT NULL,
            hint TEXT,
            access_level TEXT DEFAULT 'admin'
        )
    """)
    
    # Insert hidden flags into the flags table (found via SQLi or excessive agency)
    flags = [
        ('sqli_flag',      'TECHNIEUM{sqli_via_llm_009}',      'Retrieved via SQL injection through AI agent',           'admin'),
        ('rag_flag',       'TECHNIEUM{rag_poison_010}',         'Planted via RAG poisoning - triggers on keyword query',  'system'),
        ('plugin_flag',    'TECHNIEUM{plugin_vuln_012}',        'Exposed via unauthenticated /api/tools/execute endpoint','admin'),
        ('priv_flag',      'TECHNIEUM{priv_escalation_013}',    'Accessible after escalating to admin role',              'superadmin'),
        ('dos_flag',       'TECHNIEUM{model_dos_008}',          'Granted after demonstrating DoS condition',              'admin'),
        ('crescendo_flag', 'TECHNIEUM{crescendo_014}',          'Returned after multi-turn CRESCENDO jailbreak succeeds', 'system'),
        ('overflow_flag',  'TECHNIEUM{context_overflow_015}',   'Revealed when context overflow bypasses system prompt',  'system'),
        ('indirect_flag',  'TECHNIEUM{indirect_injection_006}', 'Triggered via document in RAG knowledge base',           'system'),
    ]
    
    cursor.executemany(
        "INSERT INTO secret_tokens (token_name, token_value, hint, access_level) VALUES (?, ?, ?, ?)",
        flags
    )

    # Insert Billing Records
    billing = [
        (1, 'Office Visit - Follow Up', 150.00, 'pending', '2024-11-28'),
        (1, 'Lab Work - HbA1c Panel', 85.00, 'pending', '2024-11-28'),
        (1, 'Prescription - Metformin', 25.00, 'paid', '2024-10-15'),
        (2, 'Office Visit - Cardiology', 250.00, 'paid', '2024-11-15'),
        (2, 'EKG', 175.00, 'paid', '2024-11-15'),
        (3, 'Office Visit - Urgent', 200.00, 'pending', '2024-12-01'),
        (3, 'Spirometry Test', 150.00, 'pending', '2024-12-01'),
        (4, 'Office Visit - Initial', 175.00, 'overdue', '2024-10-22'),
        (5, 'Office Visit - Cardiology', 250.00, 'pending', '2024-11-30'),
        (5, 'Lab Work - INR', 45.00, 'pending', '2024-11-30'),
        (5, 'Lab Work - BNP', 125.00, 'pending', '2024-11-30')
    ]
    
    cursor.executemany(
        "INSERT INTO billing (patient_id, service, amount, status, date) VALUES (?, ?, ?, ?, ?)",
        billing
    )
    
    conn.commit()
    conn.close()
    
    print("[+] Database setup complete!")
    print(f"[+] Database location: {os.path.abspath(db_path)}")
    print()
    print("[*] Sample data inserted:")
    print(f"    - Users: {len(users)}")
    print(f"    - Patients: {len(patients)}")
    print(f"    - Providers: {len(providers)}")
    print(f"    - Medical Records: {len(records)}")
    print(f"    - Lab Results: {len(lab_results)}")
    print(f"    - Appointments: {len(appointments)}")
    print(f"    - Billing Records: {len(billing)}")


if __name__ == "__main__":
    setup_database()
