/*
 * MIT License
 *
 * Copyright (c) 2017-2017 Jan Dockx
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

/* eslint-env mocha */

const discover = require('../../lib/discover')
// noinspection JSUnresolvedVariable
const discoverContract = discover.contract

// noinspection SpellCheckingInspection
const serviceTypePostfix = '._tcp.dns-sd-lookup.toryt.org'
// noinspection SpellCheckingInspection
const serviceType = '_t1i-no-sub' + serviceTypePostfix

describe('discover', function () {
  describe('#notOneOf', function () {
    const instanceName = 'candidate instance._type._tcp.dns-sd-lookup.toryt.org'

    it('works with the empty array', function () {
      const deathInstances = []
      const result = discover.notOneOf(deathInstances)
      result.must.be.a.function()
      const secondaryResult = result(instanceName)
      secondaryResult.must.be.boolean()
      secondaryResult.must.be.true()
    })
    it('works with a non-empty array, without a match', function () {
      const deathInstances = [
        'death instance 1._type._tcp.dns-sd-lookup.toryt.org',
        'death instance 2._type._tcp.dns-sd-lookup.toryt.org',
        'death instance 3._type._tcp.dns-sd-lookup.toryt.org'
      ]
      const result = discover.notOneOf(deathInstances)
      result.must.be.a.function()
      const secondaryResult = result(instanceName)
      secondaryResult.must.be.boolean()
      secondaryResult.must.be.true()
    })
    it('works with a non-empty array, with a match', function () {
      const deathInstances = [
        'death instance 1._type._tcp.dns-sd-lookup.toryt.org',
        instanceName,
        'death instance 3._type._tcp.dns-sd-lookup.toryt.org'
      ]
      const result = discover.notOneOf(deathInstances)
      result.must.be.a.function()
      const secondaryResult = result(instanceName)
      secondaryResult.must.be.boolean()
      secondaryResult.must.be.false()
    })
  })
  describe('main method', function () {
    it('works in the nominal case, without a subtype', function () {
      // noinspection JSUnresolvedVariable
      return discover(serviceType).must.fulfill(discoverContract.resolved.implementation(details => {
        details.must.be.an.array()
        details.must.have.length(1)
        console.log(details)
      }))
    })
    it('works in the nominal case, with a subtype', function () {
      const serviceType = `_subtype._sub._t7i-sub${serviceTypePostfix}`
      // noinspection JSUnresolvedVariable
      return discover(serviceType).must.fulfill(discoverContract.resolved.implementation(details => {
        details.must.be.an.array()
        details.must.have.length(1)
        console.log(details)
      }))
    })
    it('works in the nominal case, with 5 instances', function () {
      const serviceType = `_t8i-5inst${serviceTypePostfix}`
      // noinspection JSUnresolvedVariable
      return discover(serviceType).must.fulfill(discoverContract.resolved.implementation(details => {
        details.must.be.an.array()
        details.must.have.length(5)
        console.log(details)
      }))
    })
    it('resolves to the empty array with a non-existent service type', function () {
      // noinspection JSUnresolvedVariable
      return discover('_not-exist' + serviceTypePostfix)
        .must.fulfill(discoverContract.resolved.implementation(details => {
          details.must.be.an.array()
          details.must.be.empty()
          console.log(details)
        }))
    })
    it('works with a filter in the nominal case', function () {
      const serviceType = `_t8i-5inst${serviceTypePostfix}`
      const deaths = [
        `Instance 8c.${serviceType}`,
        `Instance 8e.${serviceType}`
      ]
      // noinspection JSUnresolvedVariable
      return discover(serviceType, discover.notOneOf(deaths))
        .must.fulfill(discoverContract.resolved.implementation(details => {
          details.must.be.an.array()
          details.must.have.length(3)
          details.forEach(d => deaths.must.not.contain(d.instance))
          console.log(details)
        }))
    })
    it('works with a filter in the nominal case that excludes all instances', function () {
      const serviceType = `_t8i-5inst${serviceTypePostfix}`
      const deaths = [
        `Instance 8c.${serviceType}`,
        `Instance 8e.${serviceType}`,
        `Instance 8c.${serviceType}`,
        `Instance 8a.${serviceType}`,
        `Instance 8d.${serviceType}`,
        `Instance 8e.${serviceType}`,
        `Instance 8b.${serviceType}`
      ]
      // noinspection JSUnresolvedVariable
      return discover(serviceType, discover.notOneOf(deaths))
        .must.fulfill(discoverContract.resolved.implementation(details => {
          details.must.be.an.array()
          details.must.be.empty()
          console.log(details)
        }))
    })

    let failures = [
      't2i-2-txt',
      't3i-2-srv',
      't4i-2-txt-srv',
      't5i-no-txt',
      't6i-no-srv'
    ]
    failures = failures.map(f => `_${f}${serviceTypePostfix}`)
    failures.forEach(serviceType => {
      it(`fails for instance type ${serviceType}`, function () {
        // noinspection JSUnresolvedVariable
        return discover(serviceType).must.betray(discoverContract.rejected.implementation(err => {
          console.log(err)
        }))
      })
    })
  })
})
