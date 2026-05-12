# Доменная модель

В этом файле описаны основные сущности системы, которые используются в ядре.

## Сущности (Entities)

### Product
Представляет товар, для которого генерируется контент.
- `name`: string (название товара)
- `category`: string (категория товара)

### SeoResult
Результат работы AI пайплайна.
- `title`: string
- `description`: string
- `keywords`: string[]
- `rawResponse`: string (полный ответ от модели)

### ContextDocument
Документ, извлеченный из векторного хранилища для контекста.
- `content`: string
- `metadata`: Record<string, any>

---
Связанные документы:
- [Архитектура](../architecture.md)
- [Процесс генерации SEO](workflows/seo-generation.md)
