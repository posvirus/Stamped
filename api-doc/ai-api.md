# AI API格式文档

## 默认格式

**request：**

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-1-5-pro-32k-250115",
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Hello!"
        }
    ]
  }'
```

**response：**

```bash
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "content": "Hello! How can I help you today?",
        "role": "assistant"
      }
    }
  ],
  "created": 1742631811,
  "id": "0217426318107460cfa43dc3f3683b1de1c09624ff49085a456ac",
  "model": "doubao-1-5-pro-32k-250115",
  "service_tier": "default",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 9,
    "prompt_tokens": 19,
    "total_tokens": 28,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  }
}
```

## Prefill Response

**request：**

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d $'{
    "messages": [
        {
            "content": "你是一个计算器，请计算： 1 + 1",
            "role": "user"
        },
        {
            "content": "=",
            "role": "assistant"
        }
    ],
    "model": "doubao-1-5-pro-32k-250115"
}'
```

**response：**

```bash
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "content": " 2",
        "role": "assistant"
      }
    }
  ],
  "created": 1742634165,
  "id": "0217426341647344ee2a242cadeb3c7acc981f0bd805884bc65fc",
  "model": "doubao-1-5-pro-32k-250115",
  "service_tier": "default",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 2,
    "prompt_tokens": 21,
    "total_tokens": 23,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  }
}
```

## 图片理解

**request：**

```bash
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d $'{
    "model": "doubao-1-5-vision-pro-32k-250115",
    "messages": [
        {
            "content": [
                {
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.volces.com/images/view.jpeg"
                    },
                    "type": "image_url"
                },
                {
                    "text": "图片主要讲了什么?",
                    "type": "text"
                }
            ],
            "role": "user"
        }
    ]
}'
```

**response：**

```bash
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "content": "画面中呈现了一幅宁静的户外景象。一个人乘坐在橙黄色的皮划艇上，手持船桨，正在平静的水面划行。水面如镜，倒映着周围景致。远处是茂密的森林，森林后方矗立着巍峨的雪山，山体覆盖着白雪。天空呈浅蓝色，飘浮着一些云朵。整体氛围静谧而美好，展现出自然的纯净与壮阔。 ",
        "role": "assistant"
      }
    }
  ],
  "created": 1742636149,
  "id": "0217426361458116592a076493be583bc5e33f80ac2dcf1efc31b",
  "model": "doubao-1-5-vision-pro-32k-250115",
  "service_tier": "default",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 85,
    "prompt_tokens": 521,
    "total_tokens": 606,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  }
}
```

## 深度推理

**request：**

```bash
curl --location "https://ark.cn-beijing.volces.com/api/v3/chat/completions" \
--header "Authorization: Bearer $ARK_API_KEY" \
--header "Content-Type: application/json" \
--data '{
 "model": "doubao-seed-1.6-250615",
     "messages": [
         {
             "role": "user",
             "content": [
                 {
                     "type":"text",
                     "text":"我要研究深度思考模型与非深度思考模型区别的课题，体现出我的专业性"
                 }
             ]
         }
     ],
     "thinking":{
         "type":"enabled"
     }
}'
```

**response：**

```bash
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "logprobs": null,
      "message": {
        "content": "\n\n推理模型与非推理模型的主要区别在于其处理任务的方式、能力侧重点以及应用场景。以下是两者的核心区别分析：\n\n---\n\n### **1. 核心定义**\n- **推理模型**  \n  具备**逻辑推理、因果推断或复杂决策**能力，***  \n\n实际应用中，两类模型常配合使用（如用非推理模型提取特征，再交给推理模型决策），以平衡效率与准确性。",
        "reasoning_content": "嗯，用户问的是推理模型和非推理模型有什么区别。我需要先理解这两个术语的具体含义。可能用户对机器学习或深度学习有一定的了解，但需要更清晰的区分。首先，我应该明确这两个概念的定义，然后从不同角度进行比较。\n\n首先，推理模型可能指的是那些需要进行逻辑推理、处理复杂任务的模型，***，而非推理模型侧重于模式识别和直接映射，帮助用户形成清晰的概念框架。\n",
        "role": "assistant"
      }
    }
  ],
  "created": 1742636537,
  "id": "0217426364949596592a076493be583bc5e33f80ac2dcf1eeaf9b",
  "model": "deepseek-r1-250120",
  "service_tier": "default",
  "object": "chat.completion",
  "usage": {
    "completion_tokens": 1207,
    "prompt_tokens": 11,
    "total_tokens": 1218,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 419
    }
  }
}
```
