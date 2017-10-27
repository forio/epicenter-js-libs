# Consensus API

## Requirements
- Users should be able to create/revoke consensus
- Users should be able to get consensus status by player & role (i.e. who's submitted and who's pending)
- Facilitator should be able to get consensus status by type by world
- Endpoint should be idempotent and resistant to common issues like double-clicking accidentally advancing twice etc

## Use Cases
- Wharton: 
    + Advance to next step once everyone finishes making decisions
        - People are allowed to 'undo' making decisions
    + Everyone chooses a market to enter among 4 different options. 
        -   STEP if everyone chooses the *same* one
            +   Also set model variable with choice
        -   Notify if someone chooses a different one
- Everest:
    + Advance to next step when all *required roles* submit
    + Advance to next step when facilitator advance
    + Advance to next step when leader advances
- Simulate UI Builder
    + run action 'ready_to_advance' & 'undo_?'
- Takouba
    + Every person in a world logs in and sees a UI with 4 "games" to play. They pick one.
    + First submission wins
    (Similar use-case as choosing company names in rio tinto/wharton, or generally "First one wins" problems)

## Proposed API Spec
Base URL: `/multiplayer/world/<worldid>/consensus/<name>/<arbitrary-stage-identifier>`

### Creating a consensus point
POST `/multiplayer/world/<worldid>/consensus/step/1`
```js
{
    operations: [
        {
            "name": "step_to",
            "arguments": [ 2 ],
        }
    ],
    requiredRoles: ['leader', 'marathoner']; // If roles is empty, use all required roles for the world by default
}
```

POST `/multiplayer/world/<worldid>/consensus/somevariable/<arbitrary-identifier>`
```js
{
    variables: {
        "Everyone Done": 1
    },
    requiredRoles: ['leader', 'marathoner']; // If roles is empty, use all required roles for the world by default
}
```

POST `/multiplayer/world/<worldid>/consensus/somevariables`
`{}`

#### Response
* `201` If consensus point doesn't exist, and has been created
* `300` If consensus already exists
* `409` If consensus was already created, but with different parameters

Returns consensus object
```js
{
    name: 'Foobar',
    created: <timestamp>
    updated: <timestamp>
    complete: false,
    status: [{
        name: 'John Smith',
        id: '',
        role: 'Leader',
        data: {}
    }], //Array of user objects with extra fields for "role" + data, (See "updating status" for data)
    pendingRoles: ['marathoner' ] //Array of role names
    submittedRoles: ['leader'] //Array of role names

    requiredRoles: [],
    result: {} //result of either operation or variable, only populated if complete
}
```

### Retreiving consensus information
GET `/multiplayer/world/<worldid>/consensus/<name>/<stage> `
    -Consensus object
GET `/multiplayer/world/<worldid>/consensus/<name>`
    - Array of consensus objects, sorted by 'updated'
GET `/multiplayer/world/<worldid>/consensus/<name>?complete=true (For reporting in facilitator screens)`

###Updating status
POST `/multiplayer/world/<worldid>/consensus/<name>/<stage>/status`
{ data: 'foobar' } -- overwrites what's already there. Arbitrary user data
DELETE `/multiplayer/world/<worldid>/consensus/<name>/<stage>/status`

Should pull up userid from auth-token (and infer role)

## Use-case solutions
(Assume there are 2 required roles P1 & P2 for these examples)

### Wharton: Advance to next step once everyone finishes decisions

Simulation starts
- P1 POST `/consensus/step/<current round>` `{ operations: [{ name: "step_to", arguments:[<current_round+1] }] }`
Gets 201
- P2 POST `/consensus/step/<current round>` `{ operations: [{ name: "step_to", arguments:[<current_round+1] }] }`
Gets 200

- P1 PUT `/consensus/step/<current round>/status` `{ data: 'I'm done' }`
    * Response has pending players
- P2 PUT `/consensus/step/<current round>/status` `{ data: 'I'm done' }`

Sim advances to next round. Cometd notifications for operation
- P1 PUT `/consensus/step/<current round>/status` `{ data: 'I'm done' }`
- P1 DELETE `/consensus/step/<current round>/status` undo

### Wharton: Set variable once everyone agrees on same market to enter
Assume 2 markets M1, M2
- P1&P2 POST `/consensus/market/M1` `{ variables: { 'Market': 1 }}`
- P1&P2 POST `/consensus/market/M2` `{ variables: { 'Market': 2 }}`

- P1 PUT `/consensus/market/M1` `{ data: 'I chose M1 because blah blah' }`
Listens on /consensus/market (not market/M1), which returns
[{
    name: 'M1',
    complete: false..
}]

- P1 PUT `/consensus/market/M2` `{ data: 'I chose M2 because blah blah' }`
Listens on /consensus/market, which returns
[{
    name: 'M1',
    complete: false..
}, {
    name: 'M2',
    complete: false
}]

UI uses this to DELETE appropriate and resubmit for right endpoint

### Everest & UI builder
Faciltiator and Leader advance case can be handled outside of the consensus API
Other cases already covered by Wharton examples

### Tabouka
P1 POST `/consensus/gametype/<someid>` `{ requiredRoles: [P1] }`
P2 POST `/consensus/gametype/<someid>` `{ requiredRoles: [P2] }` //409 conflict, role already exists
    -- won't try to choose anything after that

P2 PUT /`consensus/gametype/1/status` `{ data: 'foobar' }` //consensus is still not marked complete since P2 isn't a required role
