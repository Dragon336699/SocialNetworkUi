import { useState } from 'react'
import { ConfigProvider, Input, Spin } from 'antd'
import styles from '../Login/Login.module.css'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { RegisterRequest } from '@/app/types/User/Request/User/loginReq'
import { userService } from '@/app/services/user.service'

const Register: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterRequest>()

  const [loading, setLoading] = useState(false)

  const onRegisterSubmit = async (data: RegisterRequest) => {
    try {
      setLoading(true)
      const res = await userService.register(data)
      console.log('Đăng ký thành công:', res)
    } catch (err) {
      console.error('Lỗi đăng kí:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.loginContainer} h-screen bg-center bg-cover flex items-center justify-center`}>
      <div className={`${styles.loginBox} relative flex flex-col backdrop-blur-lg max-md:!px-9`}>
        <div className={`${styles.loginHeader} absolute flex items-center justify-center`}>
          <span className='select-none font-sans'>Register</span>
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
          <form id='registerForm' onSubmit={handleSubmit(onRegisterSubmit)} className='flex flex-col gap-4 mt-16'>
            <div>
              <Controller
                name='firstName'
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    size='large'
                    disabled={loading}
                    placeholder='First Name'
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.firstName && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.firstName.message}</p>}
            </div>

            <div>
              <Controller
                name='lastName'
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <Input
                    {...field}
                    size='large'
                    disabled={loading}
                    placeholder='Last Name'
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.lastName && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.lastName.message}</p>}
            </div>

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
                    disabled={loading}
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
                rules={{
                  required: 'Password is required',
                  validate: (value) => {
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters long'
                    }
                    if (!/[A-Z]/.test(value)) {
                      return 'Password must contain at least one uppercase letter'
                    }
                    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                      return 'Password must contain at least one special character'
                    }
                    return true
                  }
                }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    size='large'
                    disabled={loading}
                    placeholder='Password'
                    prefix={<LockOutlined />}
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.password && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.password.message}</p>}
            </div>

            <div>
              <Controller
                name='confirmPassword'
                control={control}
                rules={{
                  required: 'Confirm password is required',
                  validate: (value) => value === watch('password') || 'Passwords do not match'
                }}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    size='large'
                    disabled={loading}
                    placeholder='Confirm Password'
                    prefix={<LockOutlined />}
                    className={`${styles.loginInput}`}
                  />
                )}
              />
              {errors.confirmPassword && (
                <p className='text-red-500 text-sm pt-1 pl-5'>{errors.confirmPassword.message}</p>
              )}
            </div>
          </form>
        </ConfigProvider>

        <div className={styles.inputBox}>
          <button
            form='registerForm'
            type='submit'
            className={`${styles.inputSubmit} w-full cursor-pointer font-medium flex justify-center items-center gap-2`}
            disabled={loading}
          >
            {loading ? <Spin size='small' /> : 'Register'}
          </button>
        </div>

        <div className='text-center register'>
          <span>
            Already have an account?{' '}
            <a
              className={`font-medium hover:underline ${loading ? 'pointer-events-none opacity-60' : ''}`}
              href='/login'
            >
              Login
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Register
