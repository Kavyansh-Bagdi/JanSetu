from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
CORS(app) 
# Connect helper
def get_db_connection():
    conn = sqlite3.connect('data.db')
    conn.row_factory = sqlite3.Row
    return conn

# ------------------------
# Add Road Route
# ------------------------
@app.route('/', methods=['GET'])
def get_roads():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, name, polyline, status
            FROM Road
        ''')

        rows = cursor.fetchall()
        conn.close()

        # Convert SQLite rows into dicts
        roads = []
        for row in rows:
            try:
                coords = json.loads(row['polyline']) if row['polyline'] else []
            except json.JSONDecodeError:
                coords = []
            
            roads.append({
                "id": row['id'],
                "name": row['name'],
                "status": row['status'],
                "coordinates": coords
            })

        return jsonify(roads), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_road', methods=['POST'])
def add_road():
    try:
        data = request.get_json()

        name = data.get('name')
        location = data.get('location')
        polyline = data.get('polyline')  # should be a list of lat/lng pairs
        builder_id = data.get('builder_id')
        manager_id = data.get('manager_id')
        inspector_id = data.get('inspector_id')
        status = data.get('status', 'planned')

        # Validate required fields
        if not all([name, builder_id, manager_id, inspector_id, polyline]):
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO Road (name, location, polyline, builder_id, manager_id, inspector_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            name,
            location,
            json.dumps(polyline),  # store as JSON string
            builder_id,
            manager_id,
            inspector_id,
            status
        ))

        conn.commit()
        conn.close()

        return jsonify({'message': 'Road added successfully!'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/inspector/<int:inspector_id>', methods=['GET'])
def get_roads_by_inspector(inspector_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, name, location, polyline, status
            FROM Road
            WHERE inspector_id = ?
        ''', (inspector_id,))

        rows = cursor.fetchall()
        conn.close()

        roads = []
        for row in rows:
            try:
                coords = json.loads(row['polyline']) if row['polyline'] else []
            except json.JSONDecodeError:
                coords = []
            
            roads.append({
                "id": row['id'],
                "name": row['name'],
                "location": row['location'],
                "status": row['status'],
                "coordinates": coords
            })

        if not roads:
            return jsonify({"message": f"No roads assigned to inspector {inspector_id}."}), 404

        return jsonify(roads), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------
# For Testing
# ------------------------
if __name__ == '__main__':
    app.run(debug=True)
