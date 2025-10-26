"use client"
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Car, Eye, EyeOff, Truck, User, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState('user')
  const [licenseFront, setLicenseFront] = useState(null)
  const [licenseBack, setLicenseBack] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // ⭐ OTP STATE MANAGEMENT
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')

  const frontInputRef = useRef(null)
  const backInputRef = useRef(null)

  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file (JPEG, PNG, etc.)')
      setMessageType('error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size should be less than 5MB')
      setMessageType('error')
      return
    }

    if (type === 'front') {
      setLicenseFront(file)
    } else {
      setLicenseBack(file)
    }

    if (messageType === 'error') {
      setMessage('')
      setMessageType('')
    }
  }

  const removeFile = (type) => {
    if (type === 'front') {
      setLicenseFront(null)
      if (frontInputRef.current) frontInputRef.current.value = ''
    } else {
      setLicenseBack(null)
      if (backInputRef.current) backInputRef.current.value = ''
    }
  }

  const handleRequestOtp = async () => {
    setIsSubmitting(true)
    setMessage('')
    setMessageType('')

    try {
      const firstName = document.getElementById('firstName').value
      const lastName = document.getElementById('lastName').value
      const email = document.getElementById('email').value
      const phone = document.getElementById('phone').value
      const password = document.getElementById('password').value
      const terms = document.getElementById('terms').checked

      if (!firstName || !lastName || !email || !phone || !password || !terms || password.length < 6) {
        throw new Error('Please ensure all required fields are filled and terms are agreed.')
      }

      const formData = new FormData()
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('password', password)
      formData.append('accountType', accountType)

      if (accountType === 'driver') {
        const driverLicense = document.getElementById('driverLicense').value
        const vehicleModel = document.getElementById('vehicleModel').value
        const licensePlate = document.getElementById('licensePlate').value
        const address = document.getElementById('address').value

        if (!driverLicense || !vehicleModel || !licensePlate || !address || !licenseFront || !licenseBack) {
          throw new Error('Please fill in all driver information and upload both license images.')
        }

        formData.append('driverLicense', driverLicense)
        formData.append('vehicleModel', vehicleModel)
        formData.append('licensePlate', licensePlate)
        formData.append('address', address)
        if (licenseFront) formData.append('licenseFront', licenseFront)
        if (licenseBack) formData.append('licenseBack', licenseBack)
      }

      const response = await fetch('/api/register/request-otp', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification code.')
      }

      setMessage(result.message || `A verification code has been sent to ${email}.`)
      setMessageType('success')
      setVerificationEmail(email)
      setIsOtpSent(true)

    } catch (error) {
      console.error('OTP Request error:', error)
      setMessage(error.message || 'Registration failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsSubmitting(true)
    setMessage('')
    setMessageType('')

    if (otpCode.length !== 6) {
      setMessage('Please enter the 6-digit OTP.')
      setMessageType('error')
      setIsSubmitting(false)
      return
    }

    const email = verificationEmail

    if (!email) {
      setMessage('Error: Verification session expired. Please restart registration.')
      setMessageType('error')
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('otp', otpCode)

      const response = await fetch('/api/register/verify-otp', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed.')
      }

      setMessage(result.message || 'Account successfully created! Redirecting...')
      setMessageType('success')

      setTimeout(() => {
        setIsOtpSent(false)
        setOtpCode('')
        setVerificationEmail('')
        setMessage('')
        setMessageType('')
      }, 2000)

    } catch (error) {
      console.error('OTP Verification error:', error)
      setMessage(error.message || 'OTP verification failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = isOtpSent ? handleVerifyOtp : handleRequestOtp

  const OtpVerificationForm = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center text-gray-800">Verify Your Email</h3>
      <p className="text-center text-sm text-gray-600">
        We&apos;ve sent a 6-digit code to <b>{verificationEmail}</b>. Enter it below to complete your registration.
      </p>
      <div className="space-y-2">
        <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
          One-Time Password (OTP) *
        </label>
        <input
          id="otpCode"
          name="otpCode"
          type="text"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="123456"
        />
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || otpCode.length !== 6}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Verifying...
          </>
        ) : (
          'Verify Code & Finish'
        )}
      </button>
      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => {
            setIsOtpSent(false)
            setOtpCode('')
            setMessage('')
            setMessageType('')
          }}
          className="text-sm text-gray-600 hover:text-blue-600 hover:underline transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-black text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center">
          <button
            className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </button>
          <div className="mx-auto flex items-center gap-2">
            <Car className="h-6 w-6 text-yellow-400" />
            <span className="font-bold text-xl">Ryda</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isOtpSent ? "Verify Account" : "Create Your Account"}
          </h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {isOtpSent ? (
            <OtpVerificationForm />
          ) : (
            <>
              {/* Form continues as in your original file */}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
