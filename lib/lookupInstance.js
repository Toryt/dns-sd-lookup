/*
 * MIT License
 *
 * Copyright (c) 2017-2020 Jan Dockx
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { PromiseContract } = require('@toryt/contracts-v')
const denodeify = require('denodeify')
const resolveSrv = denodeify(require('dns').resolveSrv)
const resolveTxt = denodeify(require('dns').resolveTxt)
const ServiceInstance = require('./ServiceInstance')
const extract = require('./extract')
const validate = require('./validate')
const extendWithTxtStr = require('./extendWithTxtStr')

const invalidServiceDefinitionException = [
  function () {
    return PromiseContract.outcome(arguments) instanceof Error
  },
  function () {
    return PromiseContract.outcome(arguments).message === lookupInstanceContract.notValidMessage
  },
  function () {
    return PromiseContract.outcome(arguments).cause instanceof Error
  }
]

/**
 * Promise for a {@link ServiceInstance}, build from the contents of the SRV and TXT
 * DNS-SD records for {@code serviceInstance}.
 *
 * The Promise is betrayed ({@link lookupInstanceContract.notValidMessage}) when either
 * the SRV resource record, or the TXT resource record does not exist , or when there is
 * more than 1 SRV resource record ({@link lookupInstanceContract.moreThen1Message.SRV}),
 * or the TXT resource record ({@link lookupInstanceContract.moreThen1Message.TXT}),
 * respectively.
 *
 * There are no additional preconditions on the contents of the TXT resource record.
 */
const lookupInstanceContract = new PromiseContract({
  pre: [validate.isServiceInstance],
  post: [
    (serviceInstance, resolution) => resolution instanceof ServiceInstance,
    (serviceInstance, resolution) =>
      resolution.type ===
      `_${extract.type(serviceInstance)}._${extract.protocol(serviceInstance)}.${extract.domain(serviceInstance)}`,
    (serviceInstance, resolution) => resolution.instance === serviceInstance
  ],
  exception: invalidServiceDefinitionException.concat([
    (serviceInstance, rejection) => rejection.instance === serviceInstance
  ])
})

lookupInstanceContract.moreThen1Message = {
  SRV: 'more than 1 SRV record',
  TXT: 'more than 1 TXT record'
}
lookupInstanceContract.notValidMessage = 'service instance definition not valid'
lookupInstanceContract.invalidServiceDefinitionException = invalidServiceDefinitionException

async function exactly1 (/* !string */ serviceInstance, /* !string */ recordType, /* !Function */ resolver) {
  const records = await resolver(serviceInstance)
  if (records.length > 1) {
    const err = new Error(lookupInstanceContract.moreThen1Message[recordType])
    err.instance = serviceInstance
    err.count = records.length
    throw err
  }
  return records[0]
}

async function lookupInstanceImpl (/* !string */ serviceInstance) {
  let data
  try {
    data = await Promise.all([
      exactly1(serviceInstance, 'SRV', resolveSrv),
      (async () => {
        const txt = await exactly1(serviceInstance, 'TXT', resolveTxt)
        return txt.reduce(extendWithTxtStr, {})
      })()
    ])
  } catch (cause) {
    const err = new Error(lookupInstanceContract.notValidMessage)
    err.instance = serviceInstance
    // noinspection JSUndefinedPropertyAssignment
    err.cause = cause
    throw err
  }
  return new ServiceInstance({
    type: `_${extract.type(serviceInstance)}._${extract.protocol(serviceInstance)}.${extract.domain(serviceInstance)}`,
    instance: serviceInstance,
    host: data[0].name,
    port: data[0].port,
    priority: data[0].priority,
    weight: data[0].weight,
    details: data[1]
  })
}

const lookupInstance = lookupInstanceContract.implementation(lookupInstanceImpl)

module.exports = lookupInstance
