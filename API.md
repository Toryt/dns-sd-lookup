# @toryt/dns-sd-lookup API

## `ServiceInstance`

All lookup methods return `ServiceInstance` objects. These represent an [RFC 6763] _Service Instance_ description.

Instances have the following properties:

- `type`: string; the full [RFC 6763] _Service Type_ name, including the optional [RFC 6763] _Service Subtype_
- `instance`: string; the full [RFC 6763] _Service Instance_ name
- `host`: string; the FQDN of the host that offers the _Service Instance_ (from the DNS `SRV` resource record)
- `port`: natural Number; the TCP port at which the `host` offers the _Service Instance_ (from the DNS `SRV` resource record)
- `priority`: natural Number, that says with which priority the user should use this instance to fulfill `type`
  (lower is higher priority - from the DNS `SRV` resource record)
- `weight`:  natural Number, that says how often the user should use this instance to fulfill `type`, when
  choosing between instances with the same `priority` (from the DNS `SRV` resource record) 
- `details`: Object, that carries extra details about the _Service Instance_ this represents

The details are the key-value pairs expressed in the DNS `TXT` record. All property names are lower case.
[RFC 6763] boolean attributes (i.e., DNS `TXT` resource record strings that do not contain a `=`-character) are 
represented by a property with the attribute name as property name, and the value `true`. Otherwise, `details` property 
values of are always strings, and never `null` or `undefined`, but they might be the empty string. In general, a
property value of a `ServiceInstance.details` object can also be `false`, but an instance returned by one of the
lookup methods of this library will never return that.

According to [RFC 6763], the `details` should at least have a property `txtvers`, with a string value that represents a 
natural number.
 
    const ServiceInstance = require('@toryt/dns-sd-lookup).ServiceInstance

    const instance = new ServiceInstance({
      type: 'sub type._sub._a-service-type._tcp.dns-sd-lookup.toryt.org',
      instance: 'A Service Instance._a-service-type._tcp.dns-sd-lookup.toryt.org',
      host: 'service-host.dns-sd-lookup.toryt.org',
      port: 443,
      priority: 0,
      weight: 0,
      details: {
        at: JSON.stringify(new Date(2017, 9, 17, 0, 33, 14.535)),
        path: '/a/path',
        '%boolean#true]': true,
        'boolean@false~': false,
        txtvers: '23'
      }
    })

    console.log(instance)
    console.log('%j', instance)



## validate

A collection of string validation methods, related to [RFC 6763].

### isSubtypeOrInstanceName

The given string is a valid DNS-SD subtype or short instance name.

This means it is a _DNS label_, with dots and backslashes escaped. A DNS label consists of at least 1,
and not more then 63 characters ('octets'). Any character (octet) is allowed in a DNS label.
(This in contrast to a _host name_, the parts of an _internet host name_, _DNS domain_ or _DNS subdomain_,
for which the allowed characters are limited. E.g., they cannot contain '_' or spaces, control
characters, etc.). 

This function does not allow gratuitous escapes, i.e., a backslash must be followed by a dot or another backslash.

    const isSubtypeOrInstanceName = require('@toryt/dns-sd-lookup).isSubtypeOrInstanceName

    console.assert(isSubtypeOrInstanceName('any ∆é^# ï € / octet! is all0wed'))
    console.assert(isSubtypeOrInstanceName('dots\\.must\\.be\\.escaped'))
    console.assert(isSubtypeOrInstanceName('backslash\\\\must\\\\be\\\\escaped'))

    console.assert(!isSubtypeOrInstanceName('aLabelThatIsLongerThanIsAcceptableWhichIs63ACharactersLongLabels'))
    console.assert(!isSubtypeOrInstanceName('label.with.unescaped.dot'))
    console.assert(!isSubtypeOrInstanceName('label with \\gratuitous escape'))


### isBaseServiceType

The given string represents a [RFC 6763] base _Service Type_, i.e., a _Service Type_ without a subtype. 

    const isBaseServiceType = require('@toryt/dns-sd-lookup).isBaseServiceType

    console.assert(isBaseServiceType('_a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(isBaseServiceType('_a-service-type._udp.dns-sd-lookup.toryt.org'))
    console.assert(isBaseServiceType('_http._udp.dns-sd-lookup.toryt.org'))
    
    console.assert(!isBaseServiceType('sub type._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_a-service-type-that-is-too-long._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a-type.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a-type._other.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a-type._tcp.not_a_fqdn'))
    console.assert(!isBaseServiceType('_not a type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('not-a-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a--type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not_a_type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not a type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_9not-a-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a-type9._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_-not-a-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isBaseServiceType('_not-a-type-._tcp.dns-sd-lookup.toryt.org'))
        
    
### isBaseServiceType

The given string represents a [RFC 6763] _Service Type_, i.e., a base _Service Type_,
or a _service Type_ with a subtype.

This function does not allow gratuitous escapes, i.e., a backslash must be followed by
a dot or another backslash in the subtype label.
 
    const isServiceType = require('@toryt/dns-sd-lookup).isServiceType

    console.assert(isServiceType('_a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(isServiceType('_sub-type._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(isServiceType('sub type._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(isServiceType('_a\\.complex\\\\sub\\.service._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))

    console.assert(!isServiceType('sub type._not-a-type._other.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceType('_sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceType('._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceType('unescaped.dot._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceType('unescaped\\backslash._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceType('ThisIsLongerThanTheMaximumLengthWhichIs63CharactersForAnDNSLabel._sub._a-service-type._tcp.dns-sd-lookup.toryt.org'))


### isServiceInstance

The given string represents a [RFC 6763] _Service Instance_.

This function does not allow gratuitous escapes, i.e., a backslash must be followed by
a dot or another backslash in the instance name label.

    const isServiceInstance = require('@toryt/dns-sd-lookup).isServiceInstance

    console.assert(isServiceInstance('Instance Sérvice ∆._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(isServiceInstance('instances\\.with\\.escaped\\\\dots\\\\and\\.slashes._a-service-type._tcp.dns-sd-lookup.toryt.org'))

    console.assert(!isServiceInstance('instance._not-a-type._other.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('instance._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('_a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('unescaped.dot._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('unescaped\\backslash._a-service-type._tcp.dns-sd-lookup.toryt.org'))
    console.assert(!isServiceInstance('anInstanceThatIsLongerThanIsAcceptableWhichIs63ACharactersLabels._a-service-type._tcp.dns-sd-lookup.toryt.org'))


### validate

The validate-functions are gathered in the namespace `validate`.

    const validate = require('@toryt/dns-sd-lookup).validate

    console.assert(validate.isBaseServiceType === require('@toryt/dns-sd-lookup).isBaseServiceType)
    console.assert(validate.isServiceType === require('@toryt/dns-sd-lookup).isServiceType)
    console.assert(validate.isServiceInstance === require('@toryt/dns-sd-lookup).isServiceInstance)



## extract

### extract.subtype

Extract the subtype from a [RFC 6763] _Service Type_. If there is no subtype, the result is `undefined`.

      const extract = require('@toryt/dns-sd-lookup).extract

      console.assert(extract.subtype('_a-service-type._tcp.dns-sd-lookup.toryt.org') === undefined)
      console.assert(extract.subtype('_a-sub-service._sub._a-service-type._tcp.dns-sd-lookup.toryt.org') === '_a-sub-service')


### extract.type

Extract the (base) type from a [RFC 6763] _Service Type_ or _Service Instance_.

      const extract = require('@toryt/dns-sd-lookup).extract

      console.assert(extract.type('_a-service-type._tcp.dns-sd-lookup.toryt.org') === 'a-service-type')
      console.assert(extract.type('_a-sub-service._sub._a-service-type._tcp.dns-sd-lookup.toryt.org') === 'a-service-type')
      console.assert(extract.type('Service Instance._sub._a-service-type._tcp.dns-sd-lookup.toryt.org') === 'a-service-type')


### extract.instance

Extract the instance from a [RFC 6763] _Service Instance_.

      const extract = require('@toryt/dns-sd-lookup).extract

      console.assert(extract.instance('Service Instance._a-service-type._tcp.dns-sd-lookup.toryt.org') === 'Service Instance')


### extract.protocol

Extract the protocol from a [RFC 6763] _Service Type_ or _Service Instance_.

      const extract = require('@toryt/dns-sd-lookup).extract

      console.assert(extract.protocol('_a-service-type._tcp.dns-sd-lookup.toryt.org') === 'tcp')
      console.assert(extract.protocol('_a-sub-service._sub._a-service-type._udp.dns-sd-lookup.toryt.org') === 'udp')
      console.assert(extract.protocol('Service Instance._a-service-type._tcp.dns-sd-lookup.toryt.org') === 'tcp')


### extract.domain

Extract the domain from a [RFC 6763] _Service Type_ or _Service Instance_.

      const extract = require('@toryt/dns-sd-lookup).extract

      console.assert(extract.domain('_a-service-type._tcp.dns-sd-lookup.toryt.org') === 'dns-sd-lookup.toryt.org')
      console.assert(extract.domain('_a-sub-service._sub._a-service-type._udp.dns-sd-lookup.toryt.org') === 'dns-sd-lookup.toryt.org')
      console.assert(extract.domain('Service Instance._a-service-type._tcp.dns-sd-lookup.toryt.org') === 'dns-sd-lookup.toryt.org')



## extendWithTxtStr

Extend a given `obj` with a property based on a given DNS `TXT` resource record string that represents a
[RFC 6763] _Service Instance_ attribute.

Existing properties are never overwritten. The attribute name is converted to lower case before it is used as property
name. DNS `TXT` resource record strings that do not represents a valid [RFC 6763] _Service Instance_ attribute leave
the `obj` unchanged. A DNS `TXT` resource record string that represents a [RFC 6763] _Service Instance_ boolean 
attribute, i.e., that does not contain a `=` character, result in a JavaScript property on `obj` with value `true`.

The property values added by this method to `obj` are always either `true` or a string. The property value added
might be the empty string.
                       
    const extendWithTxtStr = require('@toryt/dns-sd-lookup).extendWithTxtStr

    const obj = {
      existing: 'existing property'
    }
    extendWithTxtStr(obj, 'newProperty=new property value')
    console.assert(obj.newproperty === 'new property value')
    extendWithTxtStr(obj, 'existing=override')
    console.assert(obj.existing === 'existing property')
    extendWithTxtStr(obj, '=this is not a valid attribute')
    console.assert(obj[''] === undefined)
    extendWithTxtStr(obj, 'empty string attribute=')
    console.assert(obj['empty string attribute'] === '')
    extendWithTxtStr(obj, 'boolean attribute')
    console.assert(obj['boolean attribute'] === true)

    console.log('%j', obj)

prints out

    {
      "existing": "existing property",
      "newproperty": "new property value",
      "empty string attribute": "",
      "boolean attribute": true
    }



## lookupInstance

Lookup the definition a [RFC 6763] _Service Instance_ in DNS and resolve to a `ServiceInstance` that represents it.

The function returns a Promise. If not exactly 1 DNS `SRV` and exactly 1 DNS `TXT` resource record is found in DNS for
the given _Service Instance_, the Promise is betrayed.
The `details` property holds an object that contains all valid attributes found in the DNS `TXT` resource record,
according to `extendWithTxtStr`.

    const lookupInstance = require('@toryt/dns-sd-lookup).lookupInstance

    return lookupInstance('instance 1._t1i-no-sub._tcp.dns-sd-lookup.toryt.org')
      .then(serviceInstance => {
        console.log('%j', serviceInstance)
      })

prints out

    {
      "type": "_t1i-no-sub._tcp.dns-sd-lookup.toryt.org",
      "instance": "instance 1._t1i-no-sub._tcp.dns-sd-lookup.toryt.org",
      "host": "host-of-instance-1.dns-sd-lookup.toryt.org",
      "port": 4141,
      "priority": 42,
      "weight": 43,
      "details": {
        "adetail": "This is a detail 1",
        "at": "2017-09-30T13:25:49Z",
        "txtvers":"44"
      }
    }



## discover

Lookup all instances for the given [RFC 6763] _Service Type_ in DNS and resolve to an Array of `ServiceInstance`
objects that represent them. Optionally, you can provide a `filter` function that filters out instances based on
the _Service Instance_ name. With that, users can specify _Service Instance_ they do not want, because they know
they are not in good health, or because they know by name that they are not interesting.

`discover.notOneOf` is a helper function that creates a `filter` function out of an Array of _Service Instance_ names.

The function does a lookup for the DNS `PTR` resource records for the _Service Type_, and does `lookupInstance` for
all instances found, that pass the `filter`.   

The function returns a Promise. If there are not exactly 1 DNS `SRV` and exactly 1 DNS `TXT` resource record in DNS for 
all found instances that pass the `filter`, the Promise is betrayed. If there is no `PTR` resource record for the
_Service Type_, or all instances are filtered out, the Promise returns the empty Array. 

    const discover = require('@toryt/dns-sd-lookup).discover

    const serviceType = '_t8i-n-inst._tcp.dns-sd-lookup.toryt.org'
    let deaths = [
      'Instance 8c',
      'Instance 8e',
      'Instance 8g',
      'Instance 8h',
      'Instance 8i',
      'Instance 8k',
      'Instance 8l'
    ]
    deaths = deaths.map(d => `${d}.${serviceType}`)

    return discover(serviceType, discover.notOneOf(deaths))
      .then(serviceInstances => {
        console.log('%j', serviceInstances)
      })

prints out

    [
      {
        "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "instance": "instance 8f._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "host": "host-of-instance-8f.dns-sd-lookup.toryt.org",
        "port": 9898,
        "priority": 200,
        "weight": 20,
        "details": {"adetail": "This is a detail 99", "at": "2017-09-30T13:25:49Z", "txtvers": "100"}
      },
      {
        "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "instance": "instance 8a._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "host": "host-of-instance-8a.dns-sd-lookup.toryt.org",
        "port": 7373,
        "priority": 50,
        "weight": 75,
        "details": {"adetail": "This is a detail 76", "at": "2017-09-30T13:25:49Z", "txtvers": "77"}
      },
      {
        "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "instance": "instance 8d._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "host": "host-of-instance-8d.dns-sd-lookup.toryt.org",
        "port": 8888,
        "priority": 150,
        "weight": 7,
        "details": {"adetail": "This is a detail 91", "at": "2017-09-30T13:25:49Z", "txtvers": "92"}
      },
      {
        "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "instance": "instance 8j._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "host": "host-of-instance-8j.dns-sd-lookup.toryt.org",
        "port": 2121,
        "priority": 300,
        "weight": 0,
        "details": {"adetail": "This is a detail 112", "at": "2017-09-30T13:25:49Z", "txtvers": "113"}
      },
      {
        "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "instance": "instance 8b._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
        "host": "host-of-instance-8b.dns-sd-lookup.toryt.org",
        "port": 7878,
        "priority": 100,
        "weight": 80,
        "details": {"adetail": "This is a detail 81", "at": "2017-09-30T13:25:49Z", "txtvers": "82"}
      }
    ]

The order of the instances is unspecified.



## selectInstance

Lookup all instances for the given [RFC 6763] _Service Type_ in DNS and resolve to the `ServiceInstance` the user
should use. Optionally, you can provide a `filter` function that filters out instances based on
the _Service Instance_ name. With that, users can specify _Service Instance_ they do not want, because they know
they are not in good health, or because they know by name that they are not interesting.

`selectInstance.notOneOf` is a helper function that creates a `filter` function out of an Array of _Service Instance_ 
names.

The function uses `discover`, and the selects the appropriate instance from the resulting Array that have passed the
`filter`, according to the rules of [RFC 2782]. The instance in the list with the lowest `priority` value is chosen.
If there is more then 1 instance with the same lowest `priority` value, one is choose random from that set, according
to the chance distribution given by the `weight` property values of the instance in the set.

The function returns a Promise. If there are not exactly 1 DNS `SRV` and exactly 1 DNS `TXT` resource record in DNS for 
all found instances that pass the `filter`, the Promise is betrayed. If there is no `PTR` resource record for the
_Service Type_, or all instances are filtered out, the Promise returns `null`. 

    const selectInstance = require('@toryt/dns-sd-lookup).selectInstance

    const serviceType = '_t8i-n-inst._tcp.dns-sd-lookup.toryt.org'
    let deaths = [
      'Instance 8a',
      'Instance 8b',
      'Instance 8c',
      'Instance 8d'
    ]
    deaths = deaths.map(d => `${d}.${serviceType}`)

    return selectInstance(serviceType, selectInstance.notOneOf(deaths)).then(serviceInstance => {
      console.log('%j', serviceInstance)
    })

prints out, e.g.,

    {
      "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
      "instance": "instance 8f._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
      "host": "host-of-instance-8f.dns-sd-lookup.toryt.org",
      "port": 9898,
      "priority": 200,
      "weight": 20,
      "details": {"adetail": "This is a detail 99", "at": "2017-09-30T13:25:49Z", "txtvers": "100"}
    }

In the example, all instances _e_ through _i_ have the same `priority`, so in another run, you might get another
answer from that set, e.g.,

    {
      "type": "_t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
      "instance": "instance 8i._t8i-n-inst._tcp.dns-sd-lookup.toryt.org",
      "host": "host-of-instance-8i.dns-sd-lookup.toryt.org",
      "port": 1818,
      "priority": 200,
      "weight": 20,
      "details": {"adetail": "This is a detail 109", "at": "2017-09-30T13:25:49Z", "txtvers": "110"}
    }





[RFC 6763]: https://www.ietf.org/rfc/rfc6763.txt
[RFC 2782]: https://www.ietf.org/rfc/rfc2782.txt