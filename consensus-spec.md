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
    requiredRoles: ['leader', 'marathoner']; // If roles is empty, use all required roles for the world by default
}
```

#### Response
* `201` If consensus point doesn't exist, and has been created
* `200` If consensus was already created, with the *same* roles
* `409` If consensus was already created, but with different required roles

Returns consensus object
```js
{
    name: 'Foobar',
    created: <timestamp>,
    updated: <timestamp>,
    creator: <user object>, #NiceToHave
    complete: false,
    submitted: [
        //Array of user objects with the addition of 2 additional fields
        // 1. 'role' 
        // 2. 'submissionTime': <timestamp> #NiceToHave
        { name: 'Smith', role: 'leader', ...otheruser props} 
    ],
    pending: [
        //Array of user objects with the addition of a 'role' field
        { name: 'Mary', role: 'marathoner', ...otheruser props} 
    ] 
    requiredRoles: ['leader', 'marathoner', ...],
}
```

### Retreiving consensus information
GET `/multiplayer/world/<worldid>/consensus/<name>/<stage> `
    -Consensus object
GET `/multiplayer/world/<worldid>/consensus/<name>`
    - Array of consensus objects, sorted by 'updated'
GET `/multiplayer/world/<worldid>/consensus/<name>?complete=true (For reporting in facilitator screens)`

###Updating consensus (signalling you're done)
Consensus endpoint supports either `/variables` or `/operations` at the end, parallel to run api. POSTing to **either** of those for a given consensus endpoint would signal your completion.

POST `/multiplayer/world/<worldid>/consensus/<name>/<stage>/variables`
{ variable1: 2, variable2: 3 }

POST `/multiplayer/world/<worldid>/consensus/<name>/<stage>/operations`
[{ name: 'step', ..}], //operations api format

Both those endpoints should support DELETE, to 'undo' your signal (of course the last person to do this won't have the luxury of that since it'll already be triggered).
DELETE `/multiplayer/world/<worldid>/consensus/<name>/<stage>/variables`

Note theres no role or user info in the url, it should infer both from the auth token.
A bad POST (say typo in variable name) should return the same error codes variable API does. This should only affect the last person to do so of course. This should not trigger completion of consensus.

## Use-case solutions
(Assume there are 2 required roles P1 & P2 for these examples)

### Wharton: Advance to next step once everyone finishes decisions

Simulation starts
- P1 POST `/consensus/step/<current round>` 
Gets 201
- P2 POST `/consensus/step/<current round>`
Gets 200

- P1 POST `/consensus/step/<current round>/operations`
    `[{ name: "step_to", arguments:[<current_round+1] }]`

* Response is consensus object with pending players
P1 can do a DELETE at this point to 'undo'

* P2 POST `/consensus/step/<current round>/operations`
    `[{ name: "step_to", arguments:[<current_round+1] }]`

Sim advances to next round. Cometd notifications for operation


### Wharton: Set variable once everyone agrees on same market to enter
Assume 2 markets M1, M2
- P1&P2 POST `/consensus/market/M1`
- P1&P2 POST `/consensus/market/M2`

- P1 POST `/consensus/market/M1/variables` 
{ Market : 1 }

P1 then Listens on /consensus/market (not market/M1), which returns
[{
    name: 'M1',
    complete: false..
    <consensus object>
}]

- P1 POST `/consensus/market/M2/variables` 
{ Market : 2 }

Listens on /consensus/market, which returns
```
[{
    name: 'M1',
    complete: false..
}, {
    name: 'M2',
    complete: false
}]
```

UI uses this to DELETE appropriate and resubmit for right endpoint

### Everest & UI builder
Faciltiator and Leader advance case can be handled outside of the consensus API
Other cases already covered by Wharton examples

### Tabouka
P1 POST `/consensus/gametype/<someid>` `{ requiredRoles: [P1] }`
P2 POST `/consensus/gametype/<someid>` `{ requiredRoles: [P2] }` //409 conflict, role already exists
    -- won't try to choose anything after that

P2 POST /`consensus/gametype/1/variables` `{ v1: 'foobar' }` //consensus is still not marked complete since P2 isn't a required role
