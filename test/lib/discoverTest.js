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

/* eslint-env mocha */

const discover = require('../../lib/discover')
const verifyPostconditions = require('../_util/verifyPostconditions')

// noinspection SpellCheckingInspection
const serviceTypePostfix = '._tcp.dns-sd-lookup.toryt.org'
// noinspection SpellCheckingInspection
const serviceType = '_t1i-no-sub' + serviceTypePostfix
const manyInstanceServiceType = '_t8i-n-inst' + serviceTypePostfix
const manyInstanceCount = 12

describe('discover', function () {
  describe('#notOneOf', function () {
    verifyPostconditions(discover.notOneOf)

    const instanceName = 'candidate instance._type._tcp.dns-sd-lookup.toryt.org'

    it('works with the empty array', function () {
      const deathInstances = []
      const result = discover.notOneOf(deathInstances)
      result.should.be.a.Function()
      const secondaryResult = result(instanceName)
      secondaryResult.should.be.Boolean()
      secondaryResult.should.be.true()
    })
    it('works with a non-empty array, without a match', function () {
      const deathInstances = [
        'death instance 1._type._tcp.dns-sd-lookup.toryt.org',
        'death instance 2._type._tcp.dns-sd-lookup.toryt.org',
        'death instance 3._type._tcp.dns-sd-lookup.toryt.org'
      ]
      const result = discover.notOneOf(deathInstances)
      result.should.be.a.Function()
      const secondaryResult = result(instanceName)
      secondaryResult.should.be.Boolean()
      secondaryResult.should.be.true()
    })
    it('works with a non-empty array, with a match', function () {
      const deathInstances = [
        'death instance 1._type._tcp.dns-sd-lookup.toryt.org',
        instanceName,
        'death instance 3._type._tcp.dns-sd-lookup.toryt.org'
      ]
      const result = discover.notOneOf(deathInstances)
      result.should.be.a.Function()
      const secondaryResult = result(instanceName)
      secondaryResult.should.be.Boolean()
      secondaryResult.should.be.false()
    })
  })
  describe('main method', function () {
    this.timeout(6000) // DNS lookups can take a long time on Travis
    verifyPostconditions(discover)

    it('works in the nominal case, without a subtype', async function () {
      const result = await discover(serviceType)
      result.should.be.an.Array()
      result.should.have.length(1)
      console.log(result)
    })
    it('works in the nominal case, with a subtype', async function () {
      const serviceType = `_subtype._sub._t7i-sub${serviceTypePostfix}`
      const result = await discover(serviceType)
      result.should.be.an.Array()
      result.should.have.length(1)
      console.log(result)
    })
    it(`works in the nominal case, with ${manyInstanceCount} instances`, async function () {
      // noinspection JSPotentiallyInvalidUsageOfThis
      this.timeout(10000)

      const result = await discover(manyInstanceServiceType)
      result.should.be.an.Array()
      result.should.have.length(manyInstanceCount)
      console.log(result)
    })
    it('resolves to the empty array with a non-existent service type', async function () {
      const result = await discover('_not-exist' + serviceTypePostfix)
      result.should.be.an.Array()
      result.should.be.empty()
      console.log(result)
    })
    it('works with a filter in the nominal case', async function () {
      const deaths = [
        `Instance_8c.${manyInstanceServiceType}`,
        `Instance_8e.${manyInstanceServiceType}`,
        `Instance_8g.${manyInstanceServiceType}`,
        `Instance_8h.${manyInstanceServiceType}`,
        `Instance_8i.${manyInstanceServiceType}`,
        `Instance_8k.${manyInstanceServiceType}`,
        `Instance_8l.${manyInstanceServiceType}`
      ]

      const /** @type Array */ result = await discover(manyInstanceServiceType, discover.notOneOf(deaths))
      result.should.be.an.Array()
      console.log(result)
      result.should.have.length(manyInstanceCount - deaths.length)
      result.forEach(d => deaths.map(death => death.toLowerCase()).should.not.containEql(d.instance))
    })
    it('works with a filter in the nominal case that excludes all instances', async function () {
      const deaths = [
        `Instance_8c.${manyInstanceServiceType}`,
        `Instance_8e.${manyInstanceServiceType}`,
        `Instance_8c.${manyInstanceServiceType}`,
        `Instance_8a.${manyInstanceServiceType}`,
        `Instance_8f.${manyInstanceServiceType}`,
        `Instance_8e.${manyInstanceServiceType}`,
        `Instance_8j.${manyInstanceServiceType}`,
        `Instance_8i.${manyInstanceServiceType}`,
        `Instance_8e.${manyInstanceServiceType}`,
        `Instance_8g.${manyInstanceServiceType}`,
        `Instance_8k.${manyInstanceServiceType}`,
        `Instance_8h.${manyInstanceServiceType}`,
        `Instance_8d.${manyInstanceServiceType}`,
        `Instance_8l.${manyInstanceServiceType}`,
        `Instance_8b.${manyInstanceServiceType}`
      ]
      const result = await discover(manyInstanceServiceType, discover.notOneOf(deaths))
      result.should.be.an.Array()
      result.should.be.empty()
      console.log(result)
    })

    let failures = ['t2i-2-txt', 't3i-2-srv', 't4i-2-txt-srv', 't5i-no-txt', 't6i-no-srv']
    failures = failures.map(f => `_${f}${serviceTypePostfix}`)
    failures.forEach(serviceType => {
      it(`fails for instance type ${serviceType}`, async function () {
        // noinspection JSUnresolvedVariable
        const err = await discover(serviceType).should.be.rejected()
        console.log(err)
      })
    })
    const aFailure = failures[0]
    it(`fails for instance type ${aFailure} with a filter`, async function () {
      // noinspection JSUnresolvedVariable
      const filter = discover.contract.filter.implementation(instance => instance.indexOf(aFailure) >= 0)
      // noinspection JSUnresolvedVariable
      filter.contract.verifyPostconditions = true
      // noinspection JSUnresolvedVariable
      const err = await discover(aFailure, filter).should.be.rejected()
      console.log(err)
      err.instance.should.containEql(aFailure)
    })
  })
})
