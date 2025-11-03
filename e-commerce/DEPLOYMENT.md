# E-Commerce Backend Deployment Guide

## Prerequisites
- Node.js v22 installed
- MongoDB database (local or cloud)
- Environment variables configured

## Environment Configuration

### Required Environment Variables (`config.env`)
Create/update `e-commerce/config.env` with production values:

```env
NODE_ENV=production
PORT=8000
DB_URL=mongodb://your-mongodb-connection-string/amigo-ecommerce
JWT_SECRET=your-secure-secret-key-here
EXPIRE_TIME=7d
```

### Important Notes:
- **DB_URL**: Use your production MongoDB connection string
- **JWT_SECRET**: Use a strong, random secret key for production
- **NODE_ENV**: Set to `production` for production deployment

## Local Setup & Testing

### 1. Install Dependencies
```bash
cd e-commerce
npm install
```

### 2. Configure Environment
Edit `config.env` with your production credentials

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server (locally)
```bash
npm run prod
# OR
npm start
```

## Docker Deployment

### 1. Build Docker Image
```bash
cd e-commerce
docker build -t amigo-backend .
```

### 2. Run with Docker Compose
```bash
# From project root
docker-compose up -d backend
```

### 3. Run Standalone Docker Container
```bash
docker run -d \
  --name amigo-backend \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e DB_URL=your-mongodb-connection-string \
  -e JWT_SECRET=your-secret-key \
  amigo-backend
```

### 4. With Environment File
```bash
docker run -d \
  --name amigo-backend \
  -p 8000:8000 \
  --env-file config.env \
  amigo-backend
```

## Production Checklist

- [ ] MongoDB database configured and accessible
- [ ] Environment variables set correctly
- [ ] CORS origins updated in `app.js` if needed
- [ ] `uploads/` folder has proper permissions
- [ ] Port 8000 is accessible (or configured differently)
- [ ] Database indexes created (if needed)
- [ ] Admin user seeded (run `node seedAdmin.js` if needed)
- [ ] SSL/HTTPS configured (handled by Traefik in docker-compose)

## API Endpoints
- Base URL: `https://amigoapi.mosalam.com/api/v1`
- Categories: `/api/v1/categories`
- Products: `/api/v1/product`
- Users: `/api/v1/user`
- Contact Forms: `/api/v1/submit`
- Orders: `/api/v1/Order`
- Sizes: `/api/v1/sizes`
- Settings: `/api/v1/settings`

## Monitoring
- Check logs: `docker logs amigo-backend`
- Health check: Make a GET request to any endpoint

## Troubleshooting

### Database Connection Issues
- Verify MongoDB connection string
- Check network connectivity
- Ensure database is running

### Port Already in Use
- Change PORT in `config.env`
- Or kill process using port 8000: `lsof -ti:8000 | xargs kill`

### CORS Errors
- Update `corsOptions.origin` in `app.js` with your frontend URLs

### Image Upload Issues
- Check `uploads/` folder exists
- Verify folder permissions: `chmod -R 755 uploads/`

