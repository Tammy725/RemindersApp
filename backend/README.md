# SyncManager Voice Backend

Backend local para convertir notas de voz en tareas.

La app viene en modo demo gratis por defecto. En ese modo no usa este backend y genera tareas de ejemplo.

## Ejecutar

```bash
cd backend
OPENAI_API_KEY=tu_api_key node server.js
```

La app llama por defecto a:

```text
http://localhost:8787/transcribe-tasks
```

En un celular real, `localhost` apunta al celular, no a tu Mac. Usa la IP de tu Mac al arrancar Expo:

```bash
EXPO_PUBLIC_VOICE_BACKEND_URL=http://TU_IP_DE_MAC:8787 npx expo start
```

Ejemplo:

```bash
EXPO_PUBLIC_VOICE_BACKEND_URL=http://192.168.1.20:8787 npx expo start
```

Para usar IA real, desactiva demo mode al iniciar Expo:

```bash
EXPO_PUBLIC_VOICE_DEMO_MODE=false EXPO_PUBLIC_VOICE_BACKEND_URL=http://TU_IP_DE_MAC:8787 npx expo start
```
