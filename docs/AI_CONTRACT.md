# AI chat contract

This document covers the Part 9 backend request and response contract for structured AI board updates.

## Endpoint

- `POST /api/ai/chat`

This route requires the authenticated MVP session cookie.

## Request body

```json
{
  "message": "Move the analytics task into Review",
  "conversationHistory": [
    {
      "role": "user",
      "content": "What is still blocked?"
    },
    {
      "role": "assistant",
      "content": "The analytics task is still in progress."
    }
  ]
}
```

Rules:

- `message` is the latest user message.
- `conversationHistory` contains prior chat turns only.
- Each history item must use role `user` or `assistant`.

## Model input

The backend sends the model:

- the current board JSON
- the prior conversation history JSON
- the latest user message
- instructions to return only JSON in the required structured shape

## Required model output shape

```json
{
  "assistantMessage": "I moved the analytics task into Review.",
  "boardUpdate": {
    "columns": [],
    "cards": {}
  }
}
```

If no board change is needed:

```json
{
  "assistantMessage": "No board change is needed right now.",
  "boardUpdate": null
}
```

## Backend response body

If no board update is applied:

```json
{
  "assistantMessage": "No board change is needed right now.",
  "boardUpdated": false,
  "board": null
}
```

If a valid board update is applied:

```json
{
  "assistantMessage": "I moved the analytics task into Review.",
  "boardUpdated": true,
  "board": {
    "columns": [],
    "cards": {}
  }
}
```

## Validation rules

- The model output must be valid JSON.
- The root value must be an object.
- `assistantMessage` must be a string.
- `boardUpdate` must be `null` or a full valid board object.
- If `boardUpdate` is present, the backend validates it with the same board rules used by `/api/board`.

## Safety behavior

- Invalid or malformed AI output is rejected.
- Board updates are only saved after validation succeeds.
- If validation fails, the backend returns an error and leaves the stored board unchanged.
