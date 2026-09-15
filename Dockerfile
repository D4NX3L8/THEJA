FROM node:22-alpine

# Instalar curl para el HEALTHCHECK
RUN apk add --no-cache curl

WORKDIR /app

# Definir variables de entorno de producción
ENV NODE_ENV=production \
    PORT=3000

# Copiar manifiestos de dependencias primero para aprovechar la caché de capas de Docker
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el resto del código de la aplicación
COPY . .

# Crear carpeta database (si no existe) y asignar permisos al usuario 'node'
RUN mkdir -p /app/database && chown -R node:node /app

# Usar usuario no privilegiado por seguridad
USER node

# Exponer el puerto por defecto
EXPOSE 3000

# Healthcheck para verificar que la API responda
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/resumen || exit 1

# Comando de inicio
CMD ["node", "server.js"]
