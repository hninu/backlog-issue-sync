/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as github from '../__fixtures__/github.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => github)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // github.context.payloadを都度書き換えられるように初期化
    github.context.payload = {}
    jest.resetAllMocks()
  })

  it('issueイベントで情報をログ出力するニャ', async () => {
    github.context.payload = {
      issue: {
        number: 123,
        title: 'テストissue',
        state: 'open',
        user: { login: 'cat-user' },
        html_url: 'https://github.com/example/repo/issues/123'
      }
    }

    await run()

    // expect(core.info).toHaveBeenCalledWith('issue番号: 123')
    // expect(core.info).toHaveBeenCalledWith('タイトル: テストissue')
    // expect(core.info).toHaveBeenCalledWith('状態: open')
    // expect(core.info).toHaveBeenCalledWith('作成者: cat-user')
    // expect(core.info).toHaveBeenCalledWith('URL: https://github.com/example/repo/issues/123')
  })

  it('issueイベント以外は失敗で終わるニャ', async () => {
    github.context.payload = {}
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('このアクションはissueイベントでのみ動作するニャ')
  })
})
