from schemas import LoginRequest, LoginResponse, UserResponse, PermitRequest, EquipmentRequest, NotificationStatusUpdate, SolicitudResponse, UpdatePhoneRequest, ApprovalUpdate, PermitRequest2, UserResponse, UserResponse
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from auth import create_access_token, verify_password, get_current_user
from fastapi.responses import JSONResponse, FileResponse
from database import create_connection, close_connection
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import timedelta, datetime
from typing import List, Optional
import logging
import mimetypes
import aiofiles
import json
import os
import time
from collections import defaultdict

app = FastAPI()

# Middleware para monitoreo de rendimiento
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        response = await call_next(request)
        execution_time = time.time() - start_time
        
        # Actualizar métricas solo si utils está disponible
        try:
            from utils import update_performance_metrics
            update_performance_metrics(execution_time, success=True, cache_hit=False)
        except ImportError:
            pass
        
        # Agregar header con tiempo de respuesta
        response.headers["X-Response-Time"] = f"{execution_time:.3f}s"
        return response
        
    except Exception as e:
        execution_time = time.time() - start_time
        
        # Actualizar métricas de error solo si utils está disponible
        try:
            from utils import update_performance_metrics
            update_performance_metrics(execution_time, success=False, cache_hit=False)
        except ImportError:
            pass
        
        raise e

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, reemplaza "*" con los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

mimetypes.add_type('application/pdf', '.pdf')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('image/png', '.png')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    try:
        from database import execute_query
        from utils import log_performance, cache_query_result, get_cached_query_result
        
        # Intentar obtener usuario del cache primero (para casos de relogin rápido)
        cache_key = f"user_login_{request.code}"
        cached_user = get_cached_query_result(cache_key, ttl=30)  # Cache corto para login
        
        if not cached_user:
            user = execute_query(
                "SELECT * FROM users WHERE code = %s", 
                (request.code,), 
                fetch_one=True
            )
            if user:
                cache_query_result(cache_key, user, ttl=30)
        else:
            user = cached_user
        
        if not user or not verify_password(request.password, user['password']):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
        access_token = create_access_token(
            data={"sub": user['code']}, expires_delta=timedelta(minutes=30)
        )
        response = {"access_token": access_token, "role": user['role']}
        return JSONResponse(content=response, headers={"Access-Control-Allow-Origin": "*"})
        
    except HTTPException:
        raise
    except Exception as e:
        # Fallback al método original si falla la optimización
        connection = create_connection()
        if connection is None:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE code = %s", (request.code,))
        user = cursor.fetchone()
        
        close_connection(connection)
        
        if not user or not verify_password(request.password, user['password']):
            raise HTTPException(status_code=400, detail="Credenciales inválidas")
        
        access_token = create_access_token(
            data={"sub": user['code']}, expires_delta=timedelta(minutes=30)
        )
        response = {"access_token": access_token, "role": user['role']}
        return JSONResponse(content=response, headers={"Access-Control-Allow-Origin": "*"})

@app.get("/auth/user", response_model=UserResponse)
def get_user_info(current_user: dict = Depends(get_current_user)):
    return {"code": current_user['code'], "name": current_user['name'], "phone": current_user['telefone']}

@app.post("/update-phone")
async def update_phone(request: UpdatePhoneRequest, current_user: dict = Depends(get_current_user)):
    try:
        from auth import refresh_user_cache
        from database import execute_query
        
        # Usar executor optimizado de queries
        result = execute_query(
            "UPDATE users SET telefone = %s WHERE code = %s",
            (request.phone, current_user['code']),
            commit=True
        )
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Limpiar caché del usuario actualizado
        refresh_user_cache(current_user['code'])
        
        return {"message": "Número de teléfono actualizado exitosamente"}
        
    except Exception as e:
        # Fallback al método original si falla la optimización
        connection = create_connection()
        if connection is None:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        cursor = connection.cursor()
        try:
            cursor.execute("""
                UPDATE users 
                SET telefone = %s
                WHERE code = %s
            """, (request.phone, current_user['code']))
            connection.commit()
            
        except Exception as fallback_e:
            connection.rollback()
            print("Database error:", str(fallback_e))
            raise HTTPException(
                status_code=500, 
                detail=f"Error al actualizar el número de teléfono: {str(fallback_e)}"
            )
        finally:
            close_connection(connection)
        
        return {"message": "Número de teléfono actualizado exitosamente"}

@app.post("/permit-request")
async def create_permit_request(
    code: str = Form(...),
    name: str = Form(...),
    phone: str = Form(...),
    dates: str = Form(...),
    noveltyType: str = Form(...),
    time: str = Form(None),
    description: str = Form(...),
    files: List[UploadFile] = File([]),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Received permit request for user: {code}")
    logger.debug(f"Request data: code={code}, name={name}, phone={phone}, dates={dates}, noveltyType={noveltyType}, time={time}, description={description}")
    logger.debug(f"Number of files received: {len(files)}")

    connection = create_connection()
    if connection is None:
        logger.error("Failed to create database connection")
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    cursor = connection.cursor()
    saved_files = []

    try:
        # Handle file uploads first
        if files:
            for file in files:
                logger.info(f"Processing file: {file.filename}")
                # Validate file type
                content_type = file.content_type
                if content_type not in ['image/jpeg', 'image/png', 'application/pdf']:
                    logger.warning(f"Invalid file type: {content_type}")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Tipo de archivo no permitido: {content_type}"
                    )
                
                # Use original filename
                original_filename = file.filename
                file_path = os.path.join(UPLOAD_DIR, original_filename)
                
                # Handle filename conflicts
                counter = 1
                while os.path.exists(file_path):
                    name, ext = os.path.splitext(original_filename)
                    new_filename = f"{name}_{counter}{ext}"
                    file_path = os.path.join(UPLOAD_DIR, new_filename)
                    counter += 1
                
                # Save file
                try:
                    async with aiofiles.open(file_path, 'wb') as buffer:
                        content = await file.read()
                        await buffer.write(content)
                    
                    saved_files.append({
                        "fileName": os.path.basename(file_path),
                        "fileUrl": os.path.basename(file_path)
                    })
                    logger.info(f"File saved: {file_path}")
                except Exception as e:
                    logger.error(f"Error saving file: {str(e)}")
                    # Clean up any files that were saved before the error
                    for saved_file in saved_files:
                        try:
                            os.remove(os.path.join(UPLOAD_DIR, saved_file['fileUrl']))
                        except Exception as cleanup_error:
                            logger.error(f"Error cleaning up file: {str(cleanup_error)}")
                    raise HTTPException(
                        status_code=500,
                        detail="Error al guardar el archivo"
                    )

        # Parse dates from JSON string
        try:
            dates_list = json.loads(dates)
            logger.debug(f"Parsed dates: {dates_list}")
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing dates JSON: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid date format")
        
        # Insert into database
        try:
            cursor.execute("""
                INSERT INTO permit_perms 
                (code, name, telefono, fecha, hora, tipo_novedad, description, files, file_name, file_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                current_user['code'],
                current_user['name'],
                phone,
                ','.join(dates_list),
                time or '',
                noveltyType,
                description,
                json.dumps([f['fileName'] for f in saved_files]) if saved_files else None,
                json.dumps([f['fileName'] for f in saved_files]) if saved_files else None,
                json.dumps([f['fileName'] for f in saved_files]) if saved_files else None
            ))
            connection.commit()
            logger.info("Database insert successful")
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            raise
        
        return {
            "message": "Solicitud de permiso creada exitosamente",
            "files": saved_files
        }
        
    except Exception as e:
        # Delete uploaded files if database operation fails
        for file in saved_files:
            try:
                os.remove(os.path.join(UPLOAD_DIR, file['fileUrl']))
            except Exception as cleanup_error:
                logger.error(f"Error cleaning up file after failure: {str(cleanup_error)}")
        
        connection.rollback()
        logger.error(f"Error in create_permit_request: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al guardar la solicitud: {str(e)}"
        )
    finally:
        close_connection(connection)
        
@app.get("/files/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(file_path)

@app.post("/new-permit-request")
async def create_new_permit_request(request: PermitRequest2):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        # Insertar en la tabla permit_perms con los campos correctos
        cursor.execute("""
            INSERT INTO permit_perms 
            (code, name, telefono, fecha, hora, tipo_novedad, description, solicitud, Aprobado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            request.code,
            request.name,
            request.phone,
            ','.join(request.dates),  # Convertir lista de fechas a string
            request.time or '',
            request.noveltyType,
            request.description,
            'approved',  # Valor por defecto para solicitud
            'pendiente'  # Valor por defecto para Aprobado
        ))
        connection.commit()
        return {"message": "Solicitud de permiso creada exitosamente", "id": cursor.lastrowid}
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear la solicitud de permiso: {str(e)}")
    finally:
        close_connection(connection)
 
@app.put("/update-approval/{request_id}")
async def update_approval(request_id: int, approval: ApprovalUpdate):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        cursor.execute("""
            UPDATE permit_perms
            SET Aprobado = %s
            WHERE id = %s
        """, (approval.approved_by, request_id))
        connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        return {"message": "Aprobación actualizada exitosamente"}
    except Exception as e:
        connection.rollback()
        print(f"Error updating approval: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar la aprobación: {str(e)}")
    finally:
        close_connection(connection)
 
@app.post("/equipment-request")
def create_equipment_request(request: EquipmentRequest, current_user: dict = Depends(get_current_user)):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO permit_post (code, name, tipo_novedad, description, zona, comp_am, comp_pm, turno)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user['code'],
            current_user['name'],
            request.type,
            request.description,
            request.zona,
            request.codeAM,
            request.codePM,
            request.shift
        ))
        connection.commit()
        
    except Exception as e:
        connection.rollback()
        print("Database error:", str(e))
        raise HTTPException(
            status_code=500, 
            detail=f"Error al guardar la solicitud de equipo: {str(e)}"
        )
    finally:
        close_connection(connection)
    
    return {"message": "Solicitud de equipo creada exitosamente"}

@app.get("/users/list")
async def get_users_list():
    try:
        from database import execute_query
        
        # Usar executor optimizado de queries
        users = execute_query(
            "SELECT code, name FROM users WHERE role = 'employee' ORDER BY code",
            fetch_all=True
        )
        return users or []
        
    except Exception as e:
        # Fallback al método original si falla la optimización
        connection = create_connection()
        if connection is None:
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT code, name 
                FROM users 
                WHERE role = 'employee'
                ORDER BY code
            """)
            users = cursor.fetchall()
            return users
        except Exception as fallback_e:
            print("Database error:", str(fallback_e))
            raise HTTPException(
                status_code=500,
                detail=f"Error al obtener la lista de usuarios: {str(fallback_e)}"
            )
        finally:
            close_connection(connection)

@app.get("/user/lists")

async def get_users_list():

    connection = create_connection()

    if connection is None:

        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute("SELECT * FROM users")

        users = cursor.fetchall()

        return users

    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Error al obtener usuarios: {str(e)}")

    finally:

        close_connection(connection)

@app.get("/requests")
def get_requests():
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        # Fetch permit requests - note that for permits, tipo_novedad is the type of permit
        cursor.execute("""
            SELECT 
                id, 
                code, 
                name, 
                telefono as phone, 
                fecha as dates, 
                hora as time, 
                tipo_novedad as type,
                tipo_novedad as noveltyType, 
                description,
                files, 
                time_created as createdAt, 
                solicitud as status,
                respuesta as reason, 
                notifications
            FROM permit_perms
        """)
        permit_requests = cursor.fetchall()

        # Fetch equipment requests - note that for equipment, tipo_novedad is the type itself
        cursor.execute("""
            SELECT 
                id, 
                code, 
                name, 
                tipo_novedad as type,
                description, 
                time_created as createdAt,
                solicitud as status, 
                respuesta as reason, 
                notifications, 
                zona, 
                comp_am as codeAM, 
                comp_pm as codePM,
                turno as shift
            FROM permit_post
        """)
        equipment_requests = cursor.fetchall()
        
        # Process the requests to ensure consistent format
        for request in permit_requests + equipment_requests:
            # Convert any None/NULL values to empty strings or appropriate defaults
            for key in request:
                if request[key] is None:
                    request[key] = ""
            
            # Ensure dates are properly formatted if they exist
            if request.get('dates'):
                if isinstance(request['dates'], str):
                    request['dates'] = [request['dates']]
                elif isinstance(request['dates'], (list, tuple)):
                    request['dates'] = list(request['dates'])
            
            # Convert files to list if it's a string
            if request.get('files') and isinstance(request['files'], str):
                try:
                    request['files'] = request['files'].split(',')
                except:
                    request['files'] = [request['files']]
            
            # Ensure status is one of: pending, approved, rejected
            if request['status'] not in ['pending', 'approved', 'rejected']:
                request['status'] = 'pending'
                    
        return permit_requests + equipment_requests
        
    finally:
        cursor.close()
        close_connection(connection)

@app.get("/requests/{code}")
def get_requests(code: str):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        # Fetch permit requests - note that for permits, tipo_novedad is the type of permit
        cursor.execute(
            """
            SELECT 
                id, 
                code, 
                name, 
                telefono as phone, 
                fecha as dates, 
                hora as time, 
                tipo_novedad as type,
                tipo_novedad as noveltyType, 
                description,
                files, 
                time_created as createdAt, 
                solicitud as status,
                respuesta as reason, 
                notifications
            FROM permit_perms
            WHERE code = %s AND notifications = '0'
            """,
            (code,)
        )
        permit_requests = cursor.fetchall()

        # Fetch equipment requests - note that for equipment, tipo_novedad is the type itself
        cursor.execute(
            """
            SELECT 
                id, 
                code, 
                name, 
                tipo_novedad as type,
                description, 
                time_created as createdAt,
                solicitud as status, 
                respuesta as reason, 
                notifications, 
                zona, 
                comp_am as codeAM, 
                comp_pm as codePM,
                turno as shift
            FROM permit_post
            WHERE code = %s AND notifications = '0'    
            """,
            (code,)
        )
        equipment_requests = cursor.fetchall()
        
        # Process the requests to ensure consistent format
        for request in permit_requests + equipment_requests:
            # Convert any None/NULL values to empty strings or appropriate defaults
            for key in request:
                if request[key] is None:
                    request[key] = ""
            
            # Ensure dates are properly formatted if they exist
            if request.get('dates'):
                if isinstance(request['dates'], str):
                    request['dates'] = [request['dates']]
                elif isinstance(request['dates'], (list, tuple)):
                    request['dates'] = list(request['dates'])
            
            # Convert files to list if it's a string
            if request.get('files') and isinstance(request['files'], str):
                try:
                    request['files'] = request['files'].split(',')
                except:
                    request['files'] = [request['files']]
            
            # Ensure status is one of: pending, approved, rejected
            if request['status'] not in ['pending', 'approved', 'rejected']:
                request['status'] = 'pending'
        
        return permit_requests + equipment_requests
        
    finally:
        cursor.close()
        close_connection(connection)

@app.get("/historical-records")
async def get_historical_records(week: Optional[int] = Query(None, description="Week number to filter by")):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        current_date = datetime.now()
        start_of_week = current_date - timedelta(days=current_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        if week is not None:
            # If a specific week is requested, calculate its start and end dates
            year = current_date.year
            start_of_week = datetime.strptime(f'{year}-W{week}-1', "%Y-W%W-%w")
            end_of_week = start_of_week + timedelta(days=6)

        # Fetch only approved records from permit_perms
        cursor.execute("""
            SELECT 
            ANY_VALUE(id) as id,
            code,
            name,
            ANY_VALUE(telefono) as telefono,
            'permiso' as tipo,
            tipo_novedad as novedad,
            ANY_VALUE(hora) as hora,
            MIN(fecha) as fecha_inicio,
            MAX(fecha) as fecha_fin,
            ANY_VALUE(description) as description,
            ANY_VALUE(respuesta) as respuesta,
            ANY_VALUE(solicitud) as solicitud,
            'permiso' as request_type
            FROM permit_perms
            WHERE solicitud = 'approved'
            AND tipo_novedad NOT IN ('descanso', 'licencia')
            AND DATE(time_created) BETWEEN %s AND %s
            GROUP BY code, name, tipo_novedad
        """, (start_of_week.date(), end_of_week.date()))
        permit_records = cursor.fetchall()

        # Fetch only approved records from permit_post
        cursor.execute("""
            SELECT 
                ANY_VALUE(id) as id,
                code,
                name,
                '' as telefono,
                'equipo' as tipo,
                tipo_novedad as novedad,
                '' as hora,
                MIN(time_created) as fecha_inicio,
                MAX(time_created) as fecha_fin,
                ANY_VALUE(description) as description,
                ANY_VALUE(respuesta) as respuesta,
                ANY_VALUE(solicitud) as solicitud,
                'equipo' as request_type
            FROM permit_post
            WHERE solicitud = 'approved'
                AND DATE(time_created) BETWEEN %s AND %s
            GROUP BY code, name, tipo_novedad
        """, (start_of_week.date(), end_of_week.date()))
        equipment_records = cursor.fetchall()

        # Combine and process all records
        all_records = permit_records + equipment_records
        
        # Process the data for consistent format
        for record in all_records:
            # Convert datetime to string for both start and end dates
            if isinstance(record['fecha_inicio'], datetime):
                record['fecha_inicio'] = record['fecha_inicio'].strftime('%Y-%m-%d')
            if isinstance(record['fecha_fin'], datetime):
                record['fecha_fin'] = record['fecha_fin'].strftime('%Y-%m-%d')
    
            # Separate start and end dates
            fechas = record['fecha_inicio'].split(',')
            record['fecha_inicio'] = fechas[0] if fechas else ''
    
            fechas = record['fecha_fin'].split(',')
            record['fecha_fin'] = fechas[-1] if fechas else ''
    
            # Ensure all fields have a value
            for key in record:
                if record[key] is None:
                    record[key] = ""

        return all_records
        
    except Exception as e:
        print("Database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los registros históricos: {str(e)}"
        )
    finally:
        close_connection(connection)

@app.put("/requests/{request_id}")
def update_request(
    request_id: int,
    request: dict
):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        cursor.execute("""
            UPDATE permit_perms
            SET solicitud = %s, respuesta = %s
            WHERE id = %s
        """, (request['status'], request.get('respuesta', ''), request_id))
        
        if cursor.rowcount == 0:
            cursor.execute("""
                UPDATE permit_post
                SET solicitud = %s, respuesta = %s
                WHERE id = %s
            """, (request['status'], request.get('respuesta', ''), request_id))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
        connection.commit()
        return {"message": "Solicitud actualizada exitosamente"}
        
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        close_connection(connection)

@app.put("/requests/{request_id}/notifications")
def update_notification_status(
    request_id: int,
    payload: NotificationStatusUpdate
):
    print("Request payload:", payload)
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        # Intentar actualizar en permit_perms primero
        cursor.execute("""
            UPDATE permit_perms
            SET notifications = %s
            WHERE id = %s
        """, (payload.notification_status, request_id))
        
        if cursor.rowcount == 0:
            # Intentar en permit_post si no hubo coincidencia
            cursor.execute("""
                UPDATE permit_post
                SET notifications = %s
                WHERE id = %s
            """, (payload.notification_status, request_id))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
        connection.commit()
        return {"message": "Estado de notificación actualizado exitosamente"}
        
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        close_connection(connection)

@app.get("/solicitudes")
def get_solicitudes(current_user: dict = Depends(get_current_user)):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        # Obtener solicitudes de permisos con todos los campos relevantes
        cursor.execute("""
            SELECT 
                id,
                code,
                name,
                telefono,
                fecha,
                hora,
                tipo_novedad,
                description,
                files,
                time_created as createdAt,
                solicitud as status,
                respuesta,
                notifications,
                file_name,
                file_url,
                '' as zona,
                '' as comp_am,
                '' as comp_pm,
                '' as turno,
                'permiso' as request_type
            FROM permit_perms
            WHERE code = %s AND solicitud IN ('approved', 'rejected', 'pending')
        """, (current_user['code'],))
        permit_requests = cursor.fetchall()

        # Obtener solicitudes de equipos con todos los campos relevantes
        cursor.execute("""
            SELECT 
                id,
                code,
                name,
                tipo_novedad,
                description,
                time_created as createdAt,
                solicitud as status,
                respuesta,
                notifications,
                zona,
                comp_am,
                comp_pm,
                turno,
                '' as telefono,
                '' as fecha,
                '' as hora,
                '' as files,
                '' as file_name,
                '' as file_url,
                'solicitud' as request_type
            FROM permit_post
            WHERE code = %s AND solicitud IN ('approved', 'rejected')
        """, (current_user['code'],))
        equipment_requests = cursor.fetchall()
        
        # Combinar y procesar todas las solicitudes
        all_requests = permit_requests + equipment_requests
        
        # Procesar los datos para un formato consistente
        for request in all_requests:
            # Convertir datetime a string
            if isinstance(request['createdAt'], datetime):
                request['createdAt'] = request['createdAt'].isoformat()
            
            # Procesar archivos si existen
            if request['files'] and isinstance(request['files'], str):
                try:
                    request['files'] = request['files'].split(',')
                except:
                    request['files'] = [request['files']]
            
            # Asegurar que todos los campos tengan un valor
            for key in request:
                if request[key] is None:
                    request[key] = ""
        
        return JSONResponse(content=json.loads(json.dumps(all_requests, default=str)))
        
    except Exception as e:
        print("Database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener las solicitudes: {str(e)}"
        )
    finally:
        close_connection(connection)
        
@app.get("/user/{code}")
def get_user_by_code(code: str):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT code, name, telefone as phone FROM users WHERE code = %s", (code,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    finally:
        close_connection(connection)
        
@app.delete("/requests/{request_id}")
async def delete_request(request_id: int):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor()
    try:
        # Intentar eliminar de permit_perms primero
        cursor.execute("DELETE FROM permit_perms WHERE id = %s", (request_id,))
        
        if cursor.rowcount == 0:
            # Si no se eliminó nada de permit_perms, intentar en permit_post
            cursor.execute("DELETE FROM permit_post WHERE id = %s", (request_id,))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
        connection.commit()
        return {"message": "Solicitud eliminada exitosamente"}
        
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar la solicitud: {str(e)}")
    
    finally:
        close_connection(connection)    

@app.get("/permit-request/{request_id}")
async def get_permit_request(request_id: int):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM permit_perms WHERE id = %s", (request_id,))
        request = cursor.fetchone()
        if not request:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        return request
    finally:
        close_connection(connection)
        


@app.delete("/users/{code}")

async def delete_user(code: str):

    connection = create_connection()

    if connection is None:

        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    

    cursor = connection.cursor()

    try:

        cursor.execute("DELETE FROM users WHERE code = %s", (code,))

        connection.commit()

        return {"message": "Usuario eliminado exitosamente"}

    except Exception as e:

        connection.rollback()

        raise HTTPException(status_code=500, detail=f"Error al eliminar usuario: {str(e)}")

    finally:

        close_connection(connection)


@app.put("/users/{code}")

async def update_user(code: str, user: UserResponse):

    connection = create_connection()

    if connection is None:

        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    

    cursor = connection.cursor()

    try:

        cursor.execute("""

            UPDATE users

            SET name = %s, telefone = %s, email = %s, password = %s

            WHERE code = %s

        """, (user.name, user.phone, user.email, user.password, code))

        connection.commit()

        return {"message": "Usuario actualizado exitosamente"}

    except Exception as e:

        connection.rollback()

        raise HTTPException(status_code=500, detail=f"Error al actualizar usuario: {str(e)}")

    finally:

        close_connection(connection)
        
@app.get("/excel")
async def get_excel():
    connection = create_connection()
    if connection is None:
        logger.error("Error de conexión a la base de datos en /excel")
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                code,
                name,
                telefono,
                fecha,
                tipo_novedad AS novedad,
                description,
                respuesta,
                solicitud
            FROM permit_perms
        """)
        records = cursor.fetchall()
        logger.info(f"/excel: Registros obtenidos de la base de datos: {len(records)}")
        # Agrupamos por claves compuestas
        grouped = defaultdict(list)
        for r in records:
            key = (r['code'], r['name'], r['telefono'], r['novedad'], r['description'], r['respuesta'])
            # separa fechas por coma y limpia espacios
            try:
                fechas = [f.strip() for f in (r['fecha'] or '').split(',') if f.strip()]
            except Exception as e:
                logger.error(f"Error al procesar fechas para el registro {r}: {e}")
                fechas = []
            grouped[key].extend(fechas)
        # Construimos el resultado final
        result = []
        for key, fechas in grouped.items():
            try:
                fechas_dt = []
                for f in fechas:
                    try:
                        fechas_dt.append(datetime.strptime(f, '%Y-%m-%d'))
                    except Exception as ve:
                        logger.warning(f"Fecha mal formateada ignorada: '{f}' para key {key}: {ve}")
                if fechas_dt:
                    fecha_inicio = min(fechas_dt).strftime('%Y-%m-%d')
                    fecha_fin = max(fechas_dt).strftime('%Y-%m-%d')
                else:
                    fecha_inicio = ''
                    fecha_fin = ''
            except Exception as e:
                logger.error(f"Error al convertir fechas para key {key}: {e}")
                fecha_inicio = ''
                fecha_fin = ''
            result.append({
                'code': key[0],
                'name': key[1],
                'telefono': key[2],
                'fecha_inicio': fecha_inicio,
                'fecha_fin': fecha_fin,
                'novedad': key[3],
                'description': key[4],
                'respuesta': key[5],
            })
        logger.info(f"/excel: Registros procesados para respuesta: {len(result)}")
        return result
    except Exception as e:
        logger.error(f"Database error en /excel: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los registros de permisos: {str(e)}"
        )
    finally:
        close_connection(connection)



@app.get("/excel-novedades")
async def get_excel():
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        # Fetch only approved Descanso or Licencia no remunerada records
        cursor.execute("""
            SELECT 
                code,
                name,
                telefono,
                MIN(fecha) as fecha_inicio,
                MAX(fecha) as fecha_fin,
                tipo_novedad as novedad,
                description,
                respuesta
            FROM permit_perms
            GROUP BY code, name, telefono, tipo_novedad, description, respuesta
            ORDER BY MIN(fecha);

        """)
        records = cursor.fetchall()
        
        # Process records
        for record in records:
            if isinstance(record['fecha_inicio'], datetime):
                record['fecha_inicio'] = record['fecha_inicio'].strftime('%Y-%m-%d')
            if isinstance(record['fecha_fin'], datetime):
                record['fecha_fin'] = record['fecha_fin'].strftime('%Y-%m-%d')

        return records
        
    except Exception as e:
        print("Database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener los registros de permisos: {str(e)}"
        )
    finally:
        close_connection(connection)


@app.post("/users")

async def add_user(user: UserResponse):

    connection = create_connection()

    if connection is None:

        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    

    cursor = connection.cursor()

    try:

        cursor.execute("""

            INSERT INTO users (code, name, telefone, email, password)

            VALUES (%s, %s, %s, %s, %s)

        """, (user.code, user.name, user.phone, user.email, user.password))

        connection.commit()

        return {"message": "Usuario agregado exitosamente"}

    except Exception as e:

        connection.rollback()

        raise HTTPException(status_code=500, detail=f"Error al agregar usuario: {str(e)}")

    finally:

        close_connection(connection)

from datetime import datetime
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/history/{code}", response_model=List[dict])
async def get_user_history(code: str):
    """Obtiene el historial de solicitudes de un usuario por su código."""
    logger.info(f"Iniciando solicitud de historial para el código: {code}")
    connection = None
    cursor = None
    try:
        logger.debug("Estableciendo conexión a la base de datos...")
        connection = create_connection()
        if connection is None:
            error_msg = "Error: No se pudo establecer conexión con la base de datos"
            logger.error(error_msg)
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
        
        cursor = connection.cursor(dictionary=True)
        
        # Verificar primero si el código existe
        logger.debug(f"Buscando registros para el código: {code}")
        
        # Primero verificar si el usuario existe en la tabla de usuarios
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE code = %s", (code,))
        user_exists = cursor.fetchone()['count'] > 0
        
        if not user_exists:
            logger.info(f"El código de usuario no existe: {code}")
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró un usuario con el código {code}"
            )
            
        # Luego verificar si tiene historial
        cursor.execute("SELECT COUNT(*) as count FROM permit_perms WHERE code = %s", (code,))
        count_result = cursor.fetchone()
        
        if not count_result or count_result['count'] == 0:
            logger.info(f"No se encontraron registros para el código: {code}")
            return []  # Retornar lista vacía si no hay registros
        
        logger.debug(f"Se encontraron {count_result['count']} registros para el código: {code}")
            
        # Obtener el historial
        query = """
            SELECT 
                id, 
                COALESCE(tipo_novedad, 'Sin tipo') AS type, 
                COALESCE(time_created, NOW()) AS createdAt, 
                COALESCE(fecha, '') AS requestedDates, 
                COALESCE(solicitud, 'Pendiente') AS status
            FROM permit_perms
            WHERE code = %s
            ORDER BY time_created DESC
            LIMIT 50
        """
        logger.debug(f"Ejecutando consulta: {query} con código: {code}")
        cursor.execute(query, (code,))
        
        history = cursor.fetchall()
        logger.debug(f"Se obtuvieron {len(history)} registros de historial")
        
        # Procesar las fechas para que sean serializables
        for item in history:
            if 'createdAt' in item and item['createdAt']:
                try:
                    if isinstance(item['createdAt'], str):
                        item['createdAt'] = datetime.strptime(item['createdAt'], "%Y-%m-%d %H:%M:%S").isoformat()
                    elif hasattr(item['createdAt'], 'isoformat'):
                        item['createdAt'] = item['createdAt'].isoformat()
                except (ValueError, AttributeError) as e:
                    logger.warning(f"Error al formatear fecha: {str(e)}")
                    item['createdAt'] = datetime.now().isoformat()
        
        logger.info(f"Historial obtenido exitosamente para el código: {code}")
        return history
        
    except Exception as e:
        error_msg = f"Error en get_user_history para código {code}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )
    finally:
        try:
            if cursor:
                cursor.close()
                logger.debug("Cursor cerrado")
            if connection:
                close_connection(connection)
                logger.debug("Conexión cerrada")
        except Exception as e:
            logger.error(f"Error al cerrar recursos: {str(e)}", exc_info=True)

from pydantic import BaseModel
class DateCheck(BaseModel):
    dates: List[str]

@app.post("/check-existing-requests")
async def check_existing_requests(date_check: DateCheck, current_user: dict = Depends(get_current_user)):
    connection = create_connection()
    if connection is None:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    cursor = connection.cursor(dictionary=True)
    try:
        # Get the date range for the check
        today = datetime.now().date()
        last_wednesday = today - timedelta(days=(today.weekday() - 2) % 7)
        next_wednesday = last_wednesday + timedelta(days=7)
        
        # Convert the input dates to datetime objects
        check_dates = [datetime.strptime(date, '%Y-%m-%d').date() for date in date_check.dates]
        
        # Filter dates to only those within the Wednesday to Wednesday range
        filtered_dates = [date for date in check_dates if last_wednesday <= date < next_wednesday]
        
        if not filtered_dates:
            return {"hasExistingRequest": False}
        
        # Check for existing requests in the database
        placeholders = ', '.join(['%s'] * len(filtered_dates))
        query = f"""
            SELECT COUNT(*) as count
            FROM permit_perms
            WHERE code = %s
            AND fecha IN ({placeholders})
            AND solicitud != 'rejected'
        """
        
        cursor.execute(query, (current_user['code'], *filtered_dates))
        result = cursor.fetchone()
        
        return {"hasExistingRequest": result['count'] > 0}
        
    except Exception as e:
        print("Database error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error al verificar solicitudes existentes: {str(e)}"
        )
    finally:
        close_connection(connection)
        
@app.get("/graphql")
async def graphql_get():
    return {"message": "GraphQL endpoint not implemented. Use REST API endpoints instead."}

@app.post("/graphql")
async def graphql_post():
    return {"message": "GraphQL endpoint not implemented. Use REST API endpoints instead."}

@app.get("/stats/performance")
async def get_performance_stats():
    """Endpoint para obtener estadísticas de rendimiento del backend"""
    try:
        from utils import get_performance_stats
        from database import connection_pool
        
        stats = get_performance_stats()
        
        # Agregar información del pool de conexiones
        pool_info = {}
        if connection_pool:
            try:
                pool_info = {
                    "pool_size": connection_pool.pool_size,
                    "pool_name": connection_pool.pool_name,
                    "active_connections": "Unknown"  # mysql-connector no expone esta info fácilmente
                }
            except:
                pool_info = {"status": "Pool disponible pero sin métricas detalladas"}
        
        return {
            "performance_metrics": stats,
            "database_pool": pool_info,
            "timestamp": datetime.now().isoformat(),
            "status": "operational"
        }
    except ImportError:
        return {
            "message": "Estadísticas de rendimiento no disponibles - módulo utils no encontrado",
            "timestamp": datetime.now().isoformat(),
            "status": "limited"
        }
    except Exception as e:
        return {
            "error": f"Error obteniendo estadísticas: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "status": "error"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
