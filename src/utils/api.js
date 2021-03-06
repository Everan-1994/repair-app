import wepy from 'wepy'
import {dev_path} from '@/utils/path'

// 普通请求
const request = async (options, showLoading = true) => {
    // 显示加载中
    if (showLoading) {
        wepy.showLoading({title: '加载中'})
    }
    // 拼接请求地址
    options.url = `${dev_path}/${options.url}`
    // 调用小程序的 request 方法
    let response = await wepy.request(options)

    if (showLoading) {
        // 隐藏加载中
        setTimeout(() => {
            wepy.hideLoading()
        }, 1500)
    }

    // 重新获取token
    if (response.statusCode === 401) {
        await login()
    }

    // 服务器异常后给与提示
    if (response.statusCode === 429) {
        wepy.showModal({
            title: '提示',
            showCancel: false,
            confirmText: '朕知道了',
            content: '操作过于频繁，请1分钟后再试！'
        })
    }

    // 服务器异常后给与提示
    if (response.statusCode === 500) {
        wepy.showModal({
            title: '提示',
            showCancel: false,
            confirmText: '朕知道了',
            content: '服务器错误，请重试'
        })
    }

    // 存在新 token 则替换本地 token
    if (response.header.Authorization) {
        wepy.setStorageSync('access_token', response.header.Authorization)
    }

    return response
}

// 带身份认证的请求
const authRequest = async (options, showLoading = true) => {
    if (typeof options === 'string') {
        options = {
            url: options
        }
    }
    // 从缓存中取出 Token
    let accessToken = wepy.getStorageSync('access_token')

    // 将 Token 设置在 header 中
    let header = options.header || {}
    header.Authorization = accessToken
    options.header = header

    return request(options, showLoading)
}

// 获取用户微信信息
const getUserInfo = async () => {
    let data = await wepy.getUserInfo()
    return data.userInfo
}

// 登录
const login = async (params = {}) => {
    // code 只能使用一次，所以每次单独调用
    let loginData = await wepy.login()

    // 参数中增加code
    params.code = loginData.code

    try {
        // 接口请求 weapp/authorizations
        let response = await request({
            url: 'weapp/authorizations',
            data: params,
            method: 'POST'
        })
        // 登录成功，记录 token 信息
        if (response.statusCode === 201 || response.statusCode === 200) {
            wepy.setStorageSync('access_token', response.data.meta.access_token)
            // wepy.setStorageSync('access_token_expired_at', new Date().getTime() + response.data.meta.expires_in * 1000)
        }

        return response
    } catch (error) {
        wepy.showModal({
            title: '提示',
            showCancel: false,
            confirmText: '朕知道了',
            content: error.error || '服务器错误，请重试'
        })
    }
}

const updateFile = async (options = {}, showLoading = true) => {
    // 显示loading
    if (showLoading) {
        wepy.showLoading({title: '上传中'})
    }

    // 获取 token
    let accessToken = wepy.getStorageSync('access_token')

    // 拼接url
    options.url = `${dev_path}/${options.url}`
    let header = options.header || {}
    // 将 token 设置在 header 中
    header.Authorization = accessToken
    options.header = header

    // 上传文件
    let response = await wepy.uploadFile(options)

    if (showLoading) {
        // 隐藏 loading
        wepy.hideLoading()
    }

    return response
}

export default {
    request,
    authRequest,
    login,
    getUserInfo,
    updateFile,
}