import mysql.connector
from mysql.connector import Error

def create_connection():
    try:
        connection = mysql.connector.connect(
            host="192.168.90.32",
            port=3306,
            user="desarrollo",
            password="test_24*",
            database="bdsaocomco_solicitudpermisos"
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None

def close_connection(connection):
    if connection:
        connection.close()
