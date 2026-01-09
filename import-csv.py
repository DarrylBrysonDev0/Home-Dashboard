#!/usr/bin/env python3
"""
Import CSV data into MSSQL HomeFinance-db database
"""
import csv
import pyodbc
import sys
from datetime import datetime

# Database connection parameters
SERVER = 'localhost,1434'
DATABASE = 'HomeFinance-db'
USERNAME = 'sa'
PASSWORD = 'YourStrong@Password123'
CSV_FILE = './research/homefinance_transactions.csv'

def get_connection():
    """Establish connection to MSSQL database"""
    connection_string = (
        f'DRIVER={{ODBC Driver 18 for SQL Server}};'
        f'SERVER={SERVER};'
        f'DATABASE={DATABASE};'
        f'UID={USERNAME};'
        f'PWD={PASSWORD};'
        f'TrustServerCertificate=yes;'
    )
    try:
        conn = pyodbc.connect(connection_string)
        print(f"✓ Connected to database: {DATABASE}")
        return conn
    except pyodbc.Error as e:
        print(f"✗ Error connecting to database: {e}")
        sys.exit(1)

def import_csv_data(conn):
    """Import data from CSV file into transactions table"""
    cursor = conn.cursor()
    
    # Check if table is empty
    cursor.execute("SELECT COUNT(*) FROM transactions")
    existing_count = cursor.fetchone()[0]
    
    if existing_count > 0:
        print(f"⚠ Table already contains {existing_count} records")
        response = input("Do you want to clear the table and reimport? (yes/no): ")
        if response.lower() == 'yes':
            cursor.execute("TRUNCATE TABLE transactions")
            conn.commit()
            print("✓ Table cleared")
        else:
            print("Import cancelled")
            return
    
    # Read and insert CSV data
    insert_query = """
    INSERT INTO transactions (
        transaction_id, transaction_date, transaction_time, account_id, account_name,
        account_type, account_owner, description, category, subcategory,
        amount, transaction_type, balance_after, is_recurring, recurring_frequency, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    imported_count = 0
    error_count = 0
    
    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            print(f"\n📂 Reading from: {CSV_FILE}")
            print("⏳ Importing records...")
            
            for row in csv_reader:
                try:
                    # Convert empty strings to None
                    is_recurring = None if row['is_recurring'] == '' else (1 if row['is_recurring'] == 'True' else 0)
                    recurring_frequency = None if row['recurring_frequency'] == '' else row['recurring_frequency']
                    notes = None if row['notes'] == '' else row['notes']
                    balance_after = None if row['balance_after'] == '' else float(row['balance_after'])
                    
                    cursor.execute(insert_query, (
                        row['transaction_id'],
                        row['transaction_date'],
                        row['transaction_time'],
                        row['account_id'],
                        row['account_name'],
                        row['account_type'],
                        row['account_owner'],
                        row['description'],
                        row['category'],
                        row['subcategory'],
                        float(row['amount']),
                        row['transaction_type'],
                        balance_after,
                        is_recurring,
                        recurring_frequency,
                        notes
                    ))
                    imported_count += 1
                    
                    # Commit every 100 rows for better performance
                    if imported_count % 100 == 0:
                        conn.commit()
                        print(f"  ✓ Imported {imported_count} records...")
                        
                except Exception as e:
                    error_count += 1
                    print(f"  ✗ Error importing row {imported_count + error_count}: {e}")
            
            # Final commit
            conn.commit()
            
    except FileNotFoundError:
        print(f"✗ CSV file not found: {CSV_FILE}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error reading CSV file: {e}")
        sys.exit(1)
    
    print(f"\n{'='*50}")
    print(f"✓ Import completed!")
    print(f"  Successfully imported: {imported_count} records")
    if error_count > 0:
        print(f"  Errors encountered: {error_count} records")
    print(f"{'='*50}\n")
    
    # Display sample data
    cursor.execute("SELECT TOP 5 * FROM transactions ORDER BY transaction_date")
    print("Sample records:")
    print("-" * 50)
    for row in cursor.fetchall():
        print(f"  {row.transaction_id} | {row.transaction_date} | {row.description} | ${row.amount}")

def main():
    """Main execution"""
    print("\n" + "="*50)
    print("HomeFinance CSV Import Script")
    print("="*50 + "\n")
    
    conn = get_connection()
    
    try:
        import_csv_data(conn)
    finally:
        conn.close()
        print("\n✓ Database connection closed")

if __name__ == "__main__":
    main()
