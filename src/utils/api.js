import wepy from 'wepy'

// 服务器接口地址
const host = 'http://repair-api.wei/api'

// 普通请求
const request = async (options, showLoading = true) => {
    // 显示加载中
    if (showLoading) {
        wepy.showLoading({title: '加载中'})
    }
    // 拼接请求地址
    options.url = `${host}/${options.url}`
    // 调用小程序的 request 方法
    let res = await wepy.request(options)

    if (showLoading) {
        // 隐藏加载中
        wepy.hideLoading()
    }

    // 服务器异常后给与提示
    if (res.statusCode === 500) {
        wepy.showModal({
            title: '提示',
            content: '服务器错误，请重试'
        })
    }
    return response(res)
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

const response = async (response) => {
    return response
}

// 带身份认证的响应
const authResponse = async (res) => {
    // 判断一下响应中是否有 token，如果有就直接使用此 token 替换掉本地的 token。
    let access_token = res.headers.authorization;
    if (access_token) {
        // 如果 header 中存在 token，那么触发 refreshToken 方法，替换本地的 token
        wepy.setStorageSync('access_token', access_token)
    }

    return response(res)
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
        let authResponse = await request({
            url: 'weapp/authorizations',
            data: params,
            method: 'POST'
        })

        // 登录成功，记录 token 信息
        if (authResponse.statusCode === 200) {
            console.log(authResponse)
            console.log(authResponse.data.meta)
            wepy.setStorageSync('access_token', authResponse.data.meta.access_token)
            wepy.setStorageSync('access_token_expired_at', new Date().getTime() + authResponse.data.meta.expires_in * 1000)
        }
    } catch (error) {
        wepy.showModal({
            title: '提示',
            content: error.error || '服务器错误，请重试'
        })
    }

    return authResponse
}

export default {
    request,
    authRequest,
    response,
    authResponse,
    login,
    getUserInfo,
}