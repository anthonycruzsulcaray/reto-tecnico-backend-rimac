<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción

[Nest](https://github.com/nestjs/nest) Repositorio de inicio del framework TypeScript.


# Reto Técnico Rimac Backend 2025

## 🩺 Aplicación de agendamiento de cita médica para asegurados

Este proyecto implementa una solución backend serverless para agendar citas médicas para asegurados en Perú y Chile, usando AWS y buenas prácticas de arquitectura de software.

---

## 📚 Descripción Técnica

La aplicación permite a un asegurado:
- Agendar una cita médica (estado inicial: `pending` en DynamoDB).
- Consultar sus citas registradas.
- Procesar las citas dependiendo del país (`PE` o `CL`).
- Guardar los datos procesados en una base de datos MySQL (RDS).
- Confirmar el agendamiento finalizando el estado como `completed` en DynamoDB.

---

## 🏛️ Arquitectura

El flujo general de la aplicación es:

1. **POST** solicitud de cita → Lambda `appointment` guarda en DynamoDB (`pending`).
2. **Lambda `appointment`** publica el evento en un **SNS Topic**.
3. **SNS** enruta el evento a **SQS_PE** o **SQS_CL** según `countryISO`.
4. **Lambdas `appointment_pe` o `appointment_cl`**:
   - Leen el mensaje desde su respectivo SQS.
   - Guardan la cita en una base de datos **MySQL (RDS)**.
   - Publican un evento de confirmación en **EventBridge**.
5. **EventBridge** enruta el evento a una **SQS de confirmaciones**.
6. **Lambda `appointment`** escucha el SQS de confirmaciones y actualiza la cita en **DynamoDB** como `completed`.

---

## 🗂️ Infraestructura AWS

- **API Gateway** → Exponer endpoints HTTP.
- **Lambda Functions**:
  - `appointment` (POST/GET citas, escuchar confirmaciones de EventBridge).
  - `appointment_pe` (procesar citas Perú).
  - `appointment_cl` (procesar citas Chile).
- **DynamoDB**: almacenamiento temporal de agendamientos (`pending`/`completed`).
- **SNS Topic**: distribución de mensajes según país.
- **SQS Queues**:
  - `SQS_PE`: cola para citas de Perú.
  - `SQS_CL`: cola para citas de Chile.
  - `SQS_CONFIRMATIONS`: cola para confirmaciones.
- **EventBridge**: distribución de eventos de confirmación.
- **RDS MySQL**: almacenamiento definitivo de citas.

---

## 📑 Endpoints

### 1. Crear un agendamiento

**POST** `/appointments`

- **Request Body:**
```json
{
  "insuredId": "00001",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

- **Response:**
```json
{
  "message": "Appointment created and published to SNS successfully"
}
```

---

### 2. Consultar agendamientos por asegurado

**GET** `/appointments/{insuredId}`

- **Path Parameter:**
  - `insuredId`: ID del asegurado (ejemplo: `00001`)

- **Response:**
```json
[
  {
    "insuredId": "00001",
    "scheduleId": 100,
    "countryISO": "PE",
    "status": "pending"
  }
]
```

*(Si ya fue procesado y confirmado, el `status` será `completed`.)*

---

## 🛠️ Setup Local

### 1. Clonar el proyecto

```bash
git clone https://github.com/anthonycruzsulcaray/reto-tecnico-backend-rimac.git
cd reto-tecnico-backend-rimac
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno en `serverless.yml`

Modificar en `serverless.yml` las variables de RDS:

```yaml
provider:
  environment:
    RDS_HOST: tu-host
    RDS_PORT: 3306
    RDS_USER: tu-usuario
    RDS_PASSWORD: tu-contraseña
    RDS_DATABASE: tu-bd
```

*(Simular si no tienes una base de datos real.)*

### 4. Levantar entorno local

```bash
serverless offline
```

El servicio estará disponible en:
```
http://localhost:3000
```

---

## 🚀 Despliegue en AWS

Asegúrate de tener configuradas tus credenciales de AWS CLI:

```bash
serverless deploy
```

---

## 🧪 Pruebas Unitarias

Las pruebas unitarias están escritas con **Jest**.

Para ejecutar las pruebas:

```bash
npm run test
```

---

## 🧪 Cómo probar el flujo completo manualmente

1. **Crear cita** (POST `/appointments`)
2. **Verificar cita** (GET `/appointments/{insuredId}` ➔ debe tener `status: pending`)
3. **Esperar procesamiento automático**:
   - Lambda `appointment_pe` o `appointment_cl` procesa la cita.
   - Se confirma vía EventBridge.
   - Lambda `appointment` actualiza el `status` a `completed`.
4. **Consultar de nuevo** (GET `/appointments/{insuredId}` ➔ ahora debe tener `status: completed`).

---

## 📝 Documentación OpenAPI (Swagger)

Se encuentra el archivo `openapi.yaml` en la raíz del proyecto.

Puedes visualizarlo usando [Swagger Editor](https://editor.swagger.io/).

La documentación incluye:
- Request/Response de los endpoints.

---

## 📦 Tecnologías utilizadas

- Node.js 18.x
- TypeScript
- AWS Lambda
- API Gateway
- DynamoDB
- SNS
- SQS
- EventBridge
- RDS (MySQL)
- Serverless Framework
- Jest (pruebas unitarias)

---

## 📋 Consideraciones

- No se implementaron reintentos en caso de error (flujo "happy path").
- No se implementó el envío de correos electrónicos.
- Se asumió que la base de datos RDS MySQL ya existe.

---
