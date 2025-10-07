import { ConfigProvider, Input } from 'antd'
import styles from './Login.module.css'
import { UserOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { LoginRequest } from '@/app/types/User/Request/loginReq'
import { userService } from '@/app/services/user.service'
import ChangePasswordPopup from '../ChangePassword/ChangePassword'
import { useState } from 'react'

const Login: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginRequest>()

  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false)

  const onLoginSubmit = async (data: LoginRequest) => {
    try {
      const loginData = await userService.login(data)

      console.log(loginData)
    } catch (err) {
      console.error('Lỗi login:', err)
    }
  }

  const handleOpenChangePassword = () => {
    setIsChangePasswordVisible(true) 
  }

  const handleCloseChangePassword = () => {
    setIsChangePasswordVisible(false) 
  }
  
  return (
    <div className={`${styles.loginContainer} h-screen bg-center bg-cover flex items-center justify-center`}>
      <div className={`${styles.loginBox} relative flex flex-col backdrop-blur-lg`}>
        <div className={`${styles.loginHeader} absolute flex items-center justify-center`}>
          <span className='select-none'>Login</span>
        </div>
        <form id='loginForm' onSubmit={handleSubmit(onLoginSubmit)} className='gap-[24px] flex flex-col'>
          <ConfigProvider
            theme={{
              components: {
                Input: {
                  activeBorderColor: 'none',
                  hoverBorderColor: '#a7b3bb95',
                  activeBg: 'transparent',
                  hoverBg: 'transparent'
                }
              }
            }}
          >
            <Controller
              name='email'
              control={control}
              rules={{ required: 'Email is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  size='large'
                  placeholder='Email'
                  suffix={<UserOutlined />}
                  className={`${styles.loginEmail} ${styles.loginInput} mt-100`}
                />
              )}
            />
          </ConfigProvider>

          <ConfigProvider
            theme={{
              components: {
                Input: {
                  activeBorderColor: 'none',
                  hoverBorderColor: '#a7b3bb95',
                  activeBg: 'transparent',
                  hoverBg: 'transparent'
                }
              }
            }}
          >
            <Controller
              name='password'
              control={control}
              rules={{ required: 'Password is required' }}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size='large'
                  placeholder='Password'
                  className={`${styles.loginPassword} ${styles.loginInput}`}
                />
              )}
            />
          </ConfigProvider>
        </form>

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

        <div className='text-center register'>
          <span>
            Don't have an account?{' '}
            <a className='font-medium hover:underline' href='#'>
              Register
            </a>
          </span>
        </div>

        {/* Test Change Password */}
        <div className='text-center change-password'>
          <span>
            Want to change password?{' '}
            <a className='font-medium hover:underline' onClick={handleOpenChangePassword}>
              Change Password
            </a>
          </span>
        </div>

        <ChangePasswordPopup visible={isChangePasswordVisible} onClose={handleCloseChangePassword} />
      </div>
    </div>
  )
}

export default Login
