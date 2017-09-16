const Contract = require('@toryt/contracts-iii')
const validator = require('validator')

function regexEscape (str) {
  return str.replace(/[.^$!?=+\\]/g, '\\$&')
}

const serviceTypeOrInstanceFqdn = [
  function (fqdn) { return validator.isFQDN(fqdn.replace(/[_ ]/g, '')) },
  function (fqdn) { return /^(.+\.)*_.+\._(tcp|udp)\..+$/.test(fqdn) }
]

const extractDomain = new Contract({
  pre: serviceTypeOrInstanceFqdn,
  post: [
    function (fqdn, result) { return !!result },
    function (fqdn, result) { return typeof result === 'string' },
    function (fqdn, result) { return fqdn.endsWith(result) },
    function (fqdn, result) { return result === fqdn.match(/^.+\._(tcp|udp)\.(.*)$/)[2] },
    function (fqdn, result) { return validator.isFQDN(result) }
  ],
  exception: [
    /* istanbul ignore next : should not throw an exception */
    function () { return false }
  ]
})
.implementation(function extractDomain (fqdn) {
  const parts = fqdn.split('.')
  const lastTcp = parts.lastIndexOf('_tcp')
  const lastUdp = parts.lastIndexOf('_udp')
  return parts.slice(Math.max(lastTcp, lastUdp) + 1).join('.')
})

const extractProtocol = new Contract({
  pre: serviceTypeOrInstanceFqdn,
  post: [
    function (fqdn, result) { return result === 'udp' || result === 'tcp' },
    function (fqdn, result) { return result === fqdn.match(/^.+\._(tcp|udp)\.(.*)$/)[1] }
  ],
  exception: [
    /* istanbul ignore next : should not throw an exception */
    function () { return false }
  ]
})
.implementation(function extractDomain (fqdn) {
  const parts = fqdn.split('.')
  const lastTcp = parts.lastIndexOf('_tcp')
  const lastUdp = parts.lastIndexOf('_udp')
  return parts[Math.max(lastTcp, lastUdp)].substring(1)
})

const extractType = new Contract({
  pre: serviceTypeOrInstanceFqdn,
  post: [
    function (fqdn, result) {
      return result ===
        fqdn.match(
          new RegExp(
            `^(?:.*\\.)*_(.*?)\\._${this.protocol(fqdn)}\\.${regexEscape(this.domain(fqdn))}$`
          )
        )[1]
    }
  ],
  exception: [
    /* istanbul ignore next : should not throw an exception */
    function () { return false }
  ]
})
.implementation(function extractDomain (fqdn) {
  const parts = fqdn.split('.')
  const lastTcp = parts.lastIndexOf('_tcp')
  const lastUdp = parts.lastIndexOf('_udp')
  return parts[Math.max(lastTcp, lastUdp) - 1].substring(1)
})

const extractInstance = new Contract({
  pre: serviceTypeOrInstanceFqdn,
  post: [
    function (fqdn, result) {
      return result ===
        fqdn.match(
          new RegExp(
            `^(.*)\\._${regexEscape(this.type(fqdn))}\\._${this.protocol(fqdn)}\\.${regexEscape(this.domain(fqdn))}$`
          )
        )[1]
    }
  ],
  exception: [
    /* istanbul ignore next : should not throw an exception */
    function () { return false }
  ]
})
.implementation(function extractDomain (fqdn) {
  const parts = fqdn.split('.')
  const lastTcp = parts.lastIndexOf('_tcp')
  const lastUdp = parts.lastIndexOf('_udp')
  return parts[Math.max(lastTcp, lastUdp) - 2]
})

module.exports.domain = extractDomain
module.exports.protocol = extractProtocol
module.exports.type = extractType
module.exports.instance = extractInstance