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

const selectInstance = require('../../lib/selectInstance')
const selectionInstanceContract = selectInstance.contract
const notOneOf = selectInstance.notOneOf

// noinspection SpellCheckingInspection
const serviceTypePostfix = '._tcp.dns-sd-lookup.toryt.org'
// noinspection SpellCheckingInspection
const serviceType1Instance = '_t1i-no-sub' + serviceTypePostfix
// noinspection SpellCheckingInspection
const serviceTypeWithWeight = '_t8i-5inst' + serviceTypePostfix

describe('selectInstance', function () {
  it('works in the nominal case, without a subtype', function () {
    // noinspection JSUnresolvedVariable
    return selectInstance(serviceType1Instance)
      .must.fulfill(selectionInstanceContract.resolved.implementation(instance => {
        instance.must.be.an.object()
        console.log(instance)
      }))
  })
  it('selects according to weight', function () {
    const deaths = [
      `Instance 8a.${serviceTypeWithWeight}`,
      `Instance 8d.${serviceTypeWithWeight}`
    ]
    // noinspection JSUnresolvedVariable
    return selectInstance(serviceTypeWithWeight, notOneOf(deaths))
      .must.fulfill(selectionInstanceContract.resolved.implementation(details => {
        details.must.be.an.object()
        details.instance.must.match(`instance 8b.${serviceTypeWithWeight}`)
        console.log(details)
      }))
  })
  it('selects according to weight evenly', function () {
    const batch = 16
    this.timeout(60000)
    const timerLabel = 'selects according to weight evenly'

    const deaths = [
      `Instance 8a.${serviceTypeWithWeight}`,
      `Instance 8b.${serviceTypeWithWeight}`
    ]

    const matchExpr = new RegExp(`(instance 8c|instance 8d)\\.${serviceTypeWithWeight.replace(/\./g, '\\.')}`)

    const expected = {}
    expected[`instance 8c.${serviceTypeWithWeight}`] = 0.3
    expected[`instance 8d.${serviceTypeWithWeight}`] = 0.7

    function totalCount (selections) {
      return Object.keys(selections).reduce(
        (acc, key) => {
          acc += selections[key]
          return acc
        },
        0
      )
    }

    function report (selections) {
      const total = totalCount(selections)
      console.log(`${total} - expected c = 30%, d = 70%`)
      Object.keys(selections).forEach(k => {
        console.log('  %s: %d/%d (%f%%)', k, selections[k], total, Math.round(selections[k] * 1000 / total) / 10)
      })
      console.log()
    }
    console.time(timerLabel)

    function chain (todo, previous) {
      if (todo <= 0) {
        return previous
      }
      return chain(
        todo - batch,
        previous
          .then(selections => {
            const next = []
            for (let i = 0; i < batch; i++) {
              // noinspection JSUnresolvedFunction
              next.push(
                selectInstance(serviceTypeWithWeight, notOneOf(deaths))
                  .then(selectionInstanceContract.resolved.implementation(selection => {
                    selection.must.be.an.object()
                    selection.instance.must.match(matchExpr)
                    selections[selection.instance]
                      ? selections[selection.instance]++
                      : selections[selection.instance] = 1
                  }))
              )
            }
            return Promise.all(next).then(() => {
              report(selections)
              return selections
            })
          })
      )
    }

    return chain(1024, Promise.resolve({}))
      .then(selections => {
        console.timeEnd(timerLabel)
        const total = totalCount(selections)
        Object.keys(expected).forEach(e => {
          Math.abs(expected[e] - (selections[e] / total)).must.be.below(0.025)
        })
      })
  })
})
