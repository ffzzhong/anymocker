anymocker
============

A toy mock server based on [Anyproxy](https://github.com/alibaba/anyproxy), install by typing

```
   npm install anymocker -g
```

Simply illustrate:

![image](https://github.com/fenfenzhong92/anymocker/raw/master/anymocker.jpg)


Before all
-------------
* this is a tool used for fine tuning API json response, based on [Anyproxy](https://github.com/alibaba/anyproxy), so please follow up anyproxy instruction to setup the environment, that's the basis of rules

* use [jsonpath](https://www.npmjs.com/package/jsonpath) to locate a field in API response


Rule detail
-------------

#### here are some examples about defining a rule
* replace all API's response(json format), make all `name` field equal to `github`, all `text` field equal to `anymocker`, that's a global rule

```
$ anymocker -s save -m $..name=github $..text=anymocker
```
* replace api `xxx/xxx` response(json format), make all `name` field equal to `github`, delete all the `text` field, and then inject a field `title`, valued `devil`, that's a api rule

```
$ anymocker -s save -a xxx/xxx -m $..name=github -d $..text -i $.title=devil
```
* when both api and global rules are specified, should notice that for the same field, api will override global, below the api `xxx/xxx` will mock `text` field as `github`, and for other request(global) will mock `text` field as `gitlab`

```
$ anymocker -s save -a xxx/xxx -m $..name=github -d $..text -i $.title=devil -m $..name=gitlab
```

Fuzzy
-------------

#### if you don't want to fake data with so much pain, you can just put a `FUZZ` as the value
* only number, string and boolean can be fuzzy
* can randomly return null
* for number, there are chances to amplify and shrink by multiple
* for string, there are chances to get an empty ''

```
$ anymocker -s save -a xxx/xxx -m $..name=FUZZ -d $..text -i $.title=devil -m $..name=gitlab $..text=FUZZ
```


TODO
--------------

#### for multi apis mock, consider:

if input parameters are like this:
```
$ anymocker -s save -a api1 -m x -a api2 -m y -i z
```

you intend to make rules below:
```
{
  "api": {
    "api1": {
      "mock": [
        x
      ]
    },
    "api2": {
      "mock": [
        y
      ],
      "inject": [
        z
      ]
    }
  }
}
```
but unfortunately, what you get exactly is:
```
{
  "api": {
    "api1": {
      "mock": [
        x
      ],
      "inject": [
        z
      ]
    },
    "api2": {
      "mock": [
        y
      ]
    }
  }
}
```
the latter `-i z` will be squashed as an `api1` rule, that's because anymocker analisis parameters by order.
so please, to set a parameter at a prior place, or you just want to make it easy, try `anymocker -s save -a api1 -m x -i -a api2 -m y -i z`

