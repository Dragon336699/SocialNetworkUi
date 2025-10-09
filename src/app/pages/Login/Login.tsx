import { ConfigProvider, Input, message } from 'antd'
import styles from './Login.module.css'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { LoginRequest } from '@/app/types/User/Request/User/loginReq'
import { userService } from '@/app/services/user.service'
import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'

const Login: React.FC = () => {
  const goolgeClientId = '45298468389-dg5oe6b4ghpfogdddidgsmq5s8g8i7b2.apps.googleusercontent.com'
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginRequest>()

  const onLoginSubmit = async (data: LoginRequest) => {
    try {
      const loginData = await userService.login(data)
      if (loginData.message) {
        message.success('Đăng nhập thành công!')
      }
    } catch (err) {
      console.error('Lỗi login:', err)
      message.error('Đăng nhập thất bại!')
    }
  }
  const onGooleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const gooleLoginData = await userService.googleLogin({ googleToken: credentialResponse.credential ?? '' })
      if (gooleLoginData.message) {
        message.success('Đăng nhập thành công!')
      }
    } catch (err) {
      console.error('Lỗi login:', err)
      message.error('Đăng nhập thất bại!')
    }
  }
  return (
    <div className={`${styles.loginContainer} h-screen bg-center bg-cover flex items-center justify-center`}>
      <div className={`${styles.loginBox} relative flex flex-col backdrop-blur-lg max-md:!px-9`}>
        <div className={`${styles.loginHeader} absolute flex items-center justify-center`}>
          <span className='select-none'>Login</span>
        </div>
        <ConfigProvider
          theme={{
            components: {
              Input: {
                activeBorderColor: 'none',
                hoverBorderColor: '#c48986',
                activeBg: 'transparent',
                hoverBg: 'transparent'
              }
            }
          }}
        >
          <form id='loginForm' onSubmit={handleSubmit(onLoginSubmit)} className='flex flex-col gap-6 mt-24'>
            <div>
              <Controller
                name='email'
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    size='large'
                    placeholder='Email'
                    prefix={<UserOutlined />}
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.email && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.email.message}</p>}
            </div>
            <div>
              <Controller
                name='password'
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    size='large'
                    placeholder='Password'
                    prefix={<LockOutlined />}
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.password && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.password.message}</p>}
            </div>
          </form>
        </ConfigProvider>
        <div className={`${styles.rememberForgot} flex justify-between`}>
          <div className={styles.rememberMe}>
            <input type='checkbox' id='remember' />
            <label htmlFor='remember'>Remember me</label>
          </div>
          <div className={styles.forgot}>
            <a className='hover:underline' href='/forgot-password'>
              Forgot password?
            </a>
          </div>
        </div>
        <div className={styles.inputBox}>
          <input
            form='loginForm'
            type='submit'
            className={`${styles.inputSubmit} w-full cursor-pointer font-medium`}
            value='Login'
          />
        </div>
        <GoogleOAuthProvider clientId={goolgeClientId}>
          <GoogleLogin onSuccess={onGooleLoginSuccess} />
        </GoogleOAuthProvider>
        <div className='text-center text-white/65 register'>
          <span>
            Don't have an account?{' '}
            <a className='font-medium hover:underline' href='/register'>
              Register
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Login
