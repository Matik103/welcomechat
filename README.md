# Document Q&A System

A production-ready system for document storage, embedding generation, and AI-powered question answering using Supabase and OpenAI.

## Features

- Document upload and storage
- Vector embeddings generation
- Semantic search capabilities
- AI-powered question answering
- Rate limiting and error handling
- Monitoring and logging
- Security best practices

## Project Structure

```
.
├── README.md
├── supabase/
│   ├── functions/
│   │   ├── upload-file-to-openai/
│   │   │   ├── index.ts
│   │   │   └── config.ts
│   │   ├── query-openai-assistant/
│   │   │   ├── index.ts
│   │   │   └── config.ts
│   │   └── shared/
│   │       ├── middleware/
│   │       │   ├── cors.ts
│   │       │   ├── rateLimit.ts
│   │       │   └── errorHandler.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── utils/
│   │           ├── openai.ts
│   │           ├── supabase.ts
│   │           └── validation.ts
│   └── migrations/
│       └── 20240319000000_init.sql
├── scripts/
│   ├── deploy.sh
│   └── setup-monitoring.sh
└── config/
    ├── production.json
    └── development.json
```

## Prerequisites

- Supabase account and project
- OpenAI API key
- Node.js 18+ (for development)
- Supabase CLI

## Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
MAX_FILE_SIZE=10485760  # 10MB
```

## Setup

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run database migrations
5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy functions
./scripts/deploy.sh
```

## API Documentation

### Upload Document

```http
POST /functions/v1/upload-file-to-openai
Authorization: Bearer <service_role_key>
Content-Type: application/json

{
  "client_id": "uuid",
  "file_name": "string",
  "file_data": "string"
}
```

### Query Documents

```http
POST /functions/v1/query-openai-assistant
Authorization: Bearer <service_role_key>
Content-Type: application/json

{
  "client_id": "uuid",
  "query": "string"
}
```

## Monitoring

- Function logs available in Supabase Dashboard
- Error tracking via custom error handler
- Rate limiting metrics
- OpenAI API usage tracking

## Security

- JWT authentication
- Rate limiting
- Input validation
- File size restrictions
- Content type validation
- Row Level Security (RLS) policies

## Maintenance

Regular maintenance tasks:

1. Monitor error logs
2. Check rate limiting metrics
3. Update dependencies
4. Backup database
5. Review security policies

## Support

For issues and feature requests, please contact support@yourdomain.com

## License

MIT License - see LICENSE file for details
