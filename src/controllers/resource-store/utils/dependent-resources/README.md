# Dependent Resources

Dependent resources allows relationships between resources that exist is some well defined list,
such as the route resources list.

## Definitions

A resource that has `depends` field is said to be a "dependent resource". It is dependent on the
value of the resource types listed in its `depends` field. It cannot execute its `getData()`
function unless those other resources are present. Its `getData()` has access a `dependencies` hash
containing the current slice of each of those resources.

Resources that exist in some dependent resource's `depends` list are said to be "dependency
resources". They are a normal resources in all respects except that they need to execute
their `getData()` function first, before that of the dependent resources.

Together the "dependent resources" and their "dependency resources" are said to be "interrelated
resources".

Resources that are not related to any other resources are said to be an "independent resource".

Resources that don't appear in the list of resources are said to be an "unlisted resource".

## Rules

To avoid circular dependencies we impose the following rules.

- There must be a well defined list of resources (typically the route resource list)
- Resources with dependencies _must_ appear in the resource list.
- Resources may depend on any resource that _precedes_ it in the resource list.
- Resources may depend on themself in order for their `getData()` to access their previous value.
- Unlisted resources cannot contain dependencies.
- Independent resources may execute out of listed order.

If a resource uses `depends` contrary to these rules its `getData()` will **not** be called and it
will fail with `error: ResourceDependencyError`.

Any resource that omits `depends` cannot fail due to dependencies that exist elsewere.

## Actions

By design, certain Resource Store actions on dependency resources will have side effects on
dependent resources.

| dependency action | where dependency               | dependent side-effect |
| ----------------- | ------------------------------ | --------------------- |
| clear             |                                | clear                 |
| refresh           | getData() returns new value    | refresh               |
| refresh           | getData() returns promise      | refresh               |
| refresh           | getData() returns prev value   | -                     |
| update            | updaterFn() returns new value  | refresh               |
| update            | updaterFn() returns prev value | -                     |

Note that should a resource `depends` on itself and its `getData()` return the previous value by
reference, then returning the previous data will avoid any dependency side-effects.

Similarly an `update()` where `updaterFn` returns the value it was given will not produce
dependency side-effects.

## Internal Operation

In this section we will discuss the following example.

**Example** - route resources A-F, excluding X

```
 ROUTE RESOURCES                               UNLISTED
         ┌───────────────────────┐
         │                       │
 ┌───┐ ┌─▼─┐ ┌───┐ ┌───┐ ┌───┐ ┌─┴─┐           ┌───┐
 │   │ │   │ │   │ │   │ │   │ │   │           │   │
 │ A │ │ B │ │ C │ │ D │ │ E │ │ F │           │ X │
 │   │ │   │ │   │ │   │ │   │ │   │           │   │
 └▲─▲┘ └───┘ └─┬─┘ └─┬─┘ └───┘ └───┘           └───┘
  │ │          │     │
  │ └──────────┘     │
  │                  │
  └──────────────────┘
```

In this example we have

- 2 sets of interrelated resource `A,C,D` and `B,F`
- independent resource `E`
- some unlisted resource `X`

We can execute actions on independent or unlisted resources `E,X` at any time and in any order since
they are not interrelated with any other resources. So long as `X` omits `depends` it will operate
correctly. But for all the interrelated resources we must execute actions in the route resource
order.

For example, in executing an explicit "update" action on `A` we need to somehow "refresh"
dependencies `C,D`. To do this we create an ordered "executing state" were we first say "execute
update A" but allow the addition of "execute refresh C", "execute refresh D" as side-effects.

The `executing` state is a list of interrelated resources and actions, implemented as
`[RouteResource, ResourceStoreAction]` tuples. When we want to explicitly execute an action we
pass a similar tuple to the `executeTuples()` method.

Resource store actions that may produce dependency side-effects must be wrapped in
`actionWithDependencies()` or `mapActionWithDependencies()` such that they will generate tuples. The
actual concrete implementation of these actions must some private action that is **not** wrapped in
`withDependencies()`.

Any such private action that is dispatched while `executing` state is in place may call

- `executeForDepenents()` to effect any dependent resources.
- `getDependencies()` to get resource store data for their own dependencies.

### Executing state includes interrelated resources

All interrelated resources downstream from explicit execution need to be included in `executing`
state.

**Example** - Executing "update A"

Public `updateResourceState` action calls `executeTuples([[ ResourceA, updateResourceState ]])`
which sets initial `executing` state.

```javascript
 ▼
[[ResourceA, updateResourceState], [ResourceC, null], [ResourceD, null]]
```

Note that the `executing` state

- needs to only include resources that are interrelated and downstream for those executing, `B,F`
  may be omitted.
- includes placeholder `null` actions for resources not explicitly executing.

The `executing` state is iterated synchronously and the private actions it contains are dispatched.

Iteration first dispatches whatever action is present for `A`.

Update of `A` calls `executeForDependents(ResourceA, getResourceFromRemote)` which overrides actions
for `C,D`.

```javascript
             ▼
[[ResourceA, updateResourceState], [ResourceC, getResourceFromRemote], [ResourceD, getResourceFromRemote]]
```

Iteration moves forward and dispatches whatever action is present for `C`.

Refresh of `C` calls `executeForDependents(ResourceC, updateResourceState)` but there are do dependents of `C`.

```javascript
                                               ▼
[[ResourceA, updateResourceState], [ResourceC, getResourceFromRemote], [ResourceD, getResourceFromRemote]]
```

Iteration moves forward and dispatches whatever action is present for `D`.

Refresh of `D` has no side-effects.

```javascript
                                                                                   ▼
[[ResourceA, updateResourceState], [ResourceC, getResourceFromRemote], [ResourceD, getResourceFromRemote]]
```

With iteration complete we reset `executing` state.

```
null
```

### Executing state includes dependency resources

In order to validate dependencies we need to include all direct dependencies in `executing` state.

**Example** - Executing "refresh F"

Public update action calls `executeTuples([[ResourceD, getResourceFromRemote]])` which sets initial `executing`
state.

```javascript
 ▼
[[ ResourceA, null ], [ ResourceD, getResourceFromRemote ]]
```

Note that the `executing` state

- includes `A` as dependency of `D` even though it is not executing.
- includes placeholder `null` actions for resources not explicitly executing.

The `executing` state is iterated synchronously and the private actions it contains are dispatched.

Iteration first reaches `A` and finds there is nothing to dispatch.

```javascript
              ▼
[[ ResourceA, null ], [ ResourceD, getResourceFromRemote ]]
```

Iteration then reaches `D` and dispatches whatever action is present for `D`.

Refresh of `D` has no side-effects.

```javascript
                                   ▼
[[ ResourceA, null ], [ ResourceD, getResourceFromRemote ]]
```

During refresh of `D` the `getDependencies(ResourceD)` function is called. Since `D` depends `A` and
`A` precedes `D` in the `executing` state then we know it is a valid dependency.

With iteration complete we reset `executing` state.

```
null
```

### Independent resources execute out-of-order

Independent resources are omitted from `executing` state. We first iterate dependent resources and
then follow up any independent resources that have not been executed. In this way resources can
execute in a different order to how they appear in the resource list.

**Example** - Executing "get all resources"

Public `requestResources` action calls `executeTuples([[ResourceA, getResourceFromRemote], ...])`
for all resources which sets initial `executing` state.

```javascript
 ▼
[[ ResourceA, getResourceFromRemote ], ..., [ ResourceD, getResourceFromRemote ], [ ResourceF, getResourceFromRemote ]]
```

Note that the `executing` state

- omits `E` since it is an independent resource

Iteration first dispatches whatever action is present for `A`.

Update of `A` calls `executeForDependents(ResourceA, getResourceFromRemote)` which overrides actions
for `C,D`.

```javascript
             ▼
[[ResourceA, updateResourceState], ..., [ResourceC, getResourceFromRemote], [ResourceD, getResourceFromRemote], ...]
```

Note`C,D` already have actions in place and we simply overwrite them with the new action. As it
happens the overwritten action is the same.

We will ignore the remaining iteration since it precedes in a similar fashion.

With iteration complete we reset `executing` state.

```
null
```

At this time we find that the tuple `[ResourceE, updateResourceState]` has not yet been executed
so we do so.
