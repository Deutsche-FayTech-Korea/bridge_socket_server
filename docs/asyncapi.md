# WhiteBoard 0.1.0 0.1.0 documentation


## Table of Contents

* [Operations](#operations)
  * [SEND join_room](#send-join_room-operation)
  * [RECEIVE stroke_sync](#receive-stroke_sync-operation)
  * [SEND object_add](#send-object_add-operation)
  * [RECEIVE object_add](#receive-object_add-operation)
  * [SEND cursor_move](#send-cursor_move-operation)
  * [RECEIVE cursor_update](#receive-cursor_update-operation)
  * [RECEIVE user_left](#receive-user_left-operation)
  * [SEND object_delete](#send-object_delete-operation)
  * [RECEIVE object_delete](#receive-object_delete-operation)

## Operations

### SEND `join_room` Operation

* Operation ID: `sendJoinRoom`

#### Message 방 참가 요청 `joinRoomMessage`

*사용자가 방에 참가할 때 전송되는 메시지*

* Message ID: `joinRoomMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | 참가할 방의 고유 ID (roomId) | - | - | **additional properties are allowed** |
| roomId | string | 참가할 방의 고유 ID | - | - | - |
| userName | string | 참가자 이름 또는 닉네임 | - | - | - |

> Examples of payload _(generated)_

```json
{
  "roomId": "room123",
  "userName": "홍길동"
}
```



### SEND `object_add` Operation

* Operation ID: `sendObjectAdd`

#### Message 선 그리기 데이터 `objectAddMessage`

*선을 그릴 때 전송되는 메시지*

* Message ID: `objectAddMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| id | string | 고유한 오브젝트 ID | - | format (`uuid`) | **required** |
| objectType | string | 객체 유형 (선, 사각형, 원, 삼각형, 이미지 등) | allowed (`"line"`, `"rect"`, `"circle"`, `"triangle"`, `"png"`, `"text"`, `"arrow"`, `"ellipse"`) | - | **required** |
| style | object | - | - | - | **required**, **additional properties are allowed** |
| style.color | string | - | - | - | - |
| style.size | integer | - | - | - | - |
| points | array&lt;object&gt; | - | - | - | **required** |
| points.x | number | - | - | - | - |
| points.y | number | - | - | - | - |

> Examples of payload _(generated)_

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "objectType": "line",
  "style": {
    "color": "string",
    "size": 0
  },
  "points": [
    {
      "x": 0,
      "y": 0
    }
  ]
}
```



### RECEIVE `object_add` Operation

* Operation ID: `receiveObjectAdd`

#### Message 선 그리기 데이터 `objectAddMessage`

*선을 그릴 때 전송되는 메시지*

* Message ID: `objectAddMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| id | string | 고유한 오브젝트 ID | - | format (`uuid`) | **required** |
| objectType | string | 객체 유형 (선, 사각형, 원, 삼각형, 이미지 등) | allowed (`"line"`, `"rect"`, `"circle"`, `"triangle"`, `"png"`, `"text"`, `"arrow"`, `"ellipse"`) | - | **required** |
| style | object | - | - | - | **required**, **additional properties are allowed** |
| style.color | string | - | - | - | - |
| style.size | integer | - | - | - | - |
| points | array&lt;object&gt; | - | - | - | **required** |
| points.x | number | - | - | - | - |
| points.y | number | - | - | - | - |

> Examples of payload _(generated)_

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "objectType": "line",
  "style": {
    "color": "string",
    "size": 0
  },
  "points": [
    {
      "x": 0,
      "y": 0
    }
  ]
}
```



### RECEIVE `stroke_sync` Operation

* Operation ID: `receiveJoinRoom`

#### Message 초기 Stroke 목록 동기화 `strokeSyncMessage`

*join_room 직후 전달되는 현재 방의 stroke 목록*

* Message ID: `strokeSyncMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array&lt;object&gt; | - | - | - | - |
| id | string | 고유한 stroke ID | - | format (`uuid`) | **required** |
| objectType | string | 객체 유형 (선, 사각형, 원, 삼각형, 이미지 등) | allowed (`"line"`, `"rect"`, `"circle"`, `"triangle"`, `"png"`, `"text"`, `"arrow"`, `"ellipse"`) | - | **required** |
| style | object | - | - | - | **required**, **additional properties are allowed** |
| style.color | string | - | - | - | - |
| style.size | number | - | - | - | - |
| style.thinning | number | - | - | - | - |
| style.smoothing | number | - | - | - | - |
| style.taperStart | number | - | - | - | - |
| style.taperEnd | number | - | - | - | - |
| points | array&lt;object&gt; | - | - | - | **required** |
| points.x | number | - | - | - | - |
| points.y | number | - | - | - | - |
| points.pressure | number | - | - | - | - |

> Examples of payload _(generated)_

```json
[
  {
    "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
    "objectType": "line",
    "style": {
      "color": "#000000",
      "size": 8,
      "thinning": 0,
      "smoothing": 0,
      "taperStart": 0,
      "taperEnd": 0
    },
    "points": [
      {
        "x": 0,
        "y": 0,
        "pressure": 0
      }
    ]
  }
]
```



### SEND `cursor_move` Operation

* Operation ID: `sendCursorMove`

#### Message 커서 이동 전송 `cursorMoveMessage`

*사용자의 마우스 커서 위치를 실시간으로 전송하는 메시지*

* Message ID: `cursorMoveMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| roomId | string | 사용자가 속한 방 ID | - | - | **required** |
| userName | string | 사용자 이름 또는 닉네임 | - | - | **required** |
| x | number | 커서의 X 좌표 (브라우저 기준) | - | - | **required** |
| y | number | 커서의 Y 좌표 (브라우저 기준) | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "roomId": "room123",
  "userName": "홍길동",
  "x": 312,
  "y": 428
}
```



### RECEIVE `cursor_update` Operation

* Operation ID: `receiveCursorUpdate`

#### Message 커서 위치 업데이트 `cursorUpdateMessage`

*다른 사용자의 커서 위치를 수신하는 메시지*

* Message ID: `cursorUpdateMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| userName | string | 커서를 표시할 사용자 이름 | - | - | **required** |
| x | number | X 좌표 (화면 기준) | - | - | **required** |
| y | number | Y 좌표 (화면 기준) | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "userName": "홍길동",
  "x": 250,
  "y": 400
}
```



### RECEIVE `user_left` Operation

* Operation ID: `receiveUserLeft`

#### Message 사용자 퇴장 알림 `userLeftMessage`

*사용자가 방을 떠날 때 해당 사용자 커서를 제거하기 위한 메시지*

* Message ID: `userLeftMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | 퇴장한 사용자의 이름 | - | - | - |

> Examples of payload _(generated)_

```json
"홍길동"
```



### SEND `object_delete` Operation

* Operation ID: `sendObjectDelete`

#### Message Stroke 삭제 요청 `objectDeleteMessage`

*사용자가 특정 stroke를 삭제할 때 전송하는 메시지*

* Message ID: `objectDeleteMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| roomId | string | 삭제가 이루어지는 방의 ID | - | - | **required** |
| strokeId | string | 삭제 대상 stroke의 고유 ID | - | format (`uuid`) | **required** |

> Examples of payload _(generated)_

```json
{
  "roomId": "room123",
  "strokeId": "fa8710b6-ef61-4f21-9be0-a1a70b7123de"
}
```



### RECEIVE `object_delete` Operation

* Operation ID: `receiveObjectDelete`

#### Message Stroke 삭제 요청 `objectDeleteMessage`

*사용자가 특정 stroke를 삭제할 때 전송하는 메시지*

* Message ID: `objectDeleteMessage`
* Content type: [application/json](https://www.iana.org/assignments/media-types/application/json)

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| roomId | string | 삭제가 이루어지는 방의 ID | - | - | **required** |
| strokeId | string | 삭제 대상 stroke의 고유 ID | - | format (`uuid`) | **required** |

> Examples of payload _(generated)_

```json
{
  "roomId": "room123",
  "strokeId": "fa8710b6-ef61-4f21-9be0-a1a70b7123de"
}
```



