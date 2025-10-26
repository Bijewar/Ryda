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
  const [messageType, setMessageType] = useState('') // 'success' or 'error'

  // ⭐ OTP STATE MANAGEMENT
  const [isOtpSent, setIsOtpSent] = useState(false) // Controls the view
  const [otpCode, setOtpCode] = useState('') // User-entered OTP
  const [verificationEmail, setVerificationEmail] = useState('') // Stores email after Step 1

  const frontInputRef = useRef(null)
  const backInputRef = useRef(null)

  // --- Utility Functions ---

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

  // --- Step 1: Request OTP Handler ---
  const handleRequestOtp = async () => {
    setIsSubmitting(true)
    setMessage('')
    setMessageType('')

    try {
      // 1. Get and Validate Form Data
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

      // 2. Call the NEW API Endpoint
      const response = await fetch('/api/register/request-otp', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification code.')
      }

      // 3. Success: Switch to OTP View
      setMessage(result.message || `A verification code has been sent to ${email}.`)
      setMessageType('success')
      setVerificationEmail(email) // ⭐ CRUCIAL: Save email to state
      setIsOtpSent(true)
      
    } catch (error) {
      console.error('OTP Request error:', error)
      setMessage(error.message || 'Registration failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Step 2: Verify OTP Handler ---
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

    // ⭐ FIX: Use email from state, not the DOM
    const email = verificationEmail; 

    if (!email) {
        setMessage('Error: Verification session expired. Please restart registration.')
        setMessageType('error')
        setIsSubmitting(false)
        return
    }

    try {
      // 1. Collect data for verification
      const formData = new FormData()
      formData.append('email', email)
      formData.append('otp', otpCode)

      // 2. Call the NEW Verify OTP API Endpoint
      const response = await fetch('/api/register/verify-otp', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'OTP verification failed.')
      }

      // 3. Final Success: Clean up and Redirect
      setMessage(result.message || 'Account successfully created! Redirecting...')
      setMessageType('success')
      
      setTimeout(() => {
        // Clear state and optionally redirect
        // window.location.href = '/login' 
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

  // --- OTP Verification Component (Rendered when isOtpSent is true) ---
  const OtpVerificationForm = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-center text-gray-800">Verify Your Email</h3>
      <p className="text-center text-sm text-gray-600">
        We&apos;ve sent a 6-digit code to **{verificationEmail}**.
        Enter it below to complete your registration.
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
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            {isOtpSent ? 'Verify Account' : 'Create your account'}
          </h1>

          {/* Message Display */}
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
              {/* Account Type Toggle (Registration Form visible) */}
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setAccountType('user')} className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${accountType === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                  <div className="flex items-center justify-center gap-2"><User className="h-4 w-4" />Passenger</div>
                </button>
                <button type="button" onClick={() => setAccountType('driver')} className={`flex-1 py-3 px-4 rounded-md transition-all duration-200 font-medium ${accountType === 'driver' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
                  <div className="flex items-center justify-center gap-2"><Truck className="h-4 w-4" />Driver</div>
                </button>
              </div>

              {/* Registration Form (Fields) */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name *</label><input id="firstName" name="firstName" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter first name" /></div>
                  <div className="space-y-2"><label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name *</label><input id="lastName" name="lastName" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter last name" /></div>
                </div>

                <div className="space-y-2"><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label><input id="email" name="email" type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your email" /></div>
                <div className="space-y-2"><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone number *</label><input id="phone" name="phone" type="tel" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your phone number" /></div>

                <div className="space-y-2 relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} required minLength={6} className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your password (min 6 characters)" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Driver-specific fields */}
                {accountType === 'driver' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium text-gray-800 mb-3">Driver Information</h3>
                    <div className="space-y-2"><label htmlFor="driverLicense" className="block text-sm font-medium text-gray-700">Driver's License Number *</label><input id="driverLicense" name="driverLicense" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter license number" /></div>
                    <div className="space-y-2"><label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">Vehicle Model *</label><input id="vehicleModel" name="vehicleModel" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Toyota Camry 2020" /></div>
                    <div className="space-y-2"><label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">License Plate *</label><input id="licensePlate" name="licensePlate" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter license plate number" /></div>
                    <div className="space-y-2"><label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</label><input id="address" name="address" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your full address" /></div>
                    
                    {/* License Upload Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Driver's License Images *</h4>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Front of License</label>
                        <div className="flex items-center gap-2">
                          <input type="file" ref={frontInputRef} onChange={(e) => handleFileChange('front', e)} accept="image/*" className="hidden" />
                          <button type="button" onClick={() => frontInputRef.current?.click()} className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            <Upload className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">{licenseFront ? licenseFront.name : 'Upload Front Image'}</span>
                          </button>
                          {licenseFront && (<button type="button" onClick={() => removeFile('front')} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><X className="h-4 w-4" /></button>)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Back of License</label>
                        <div className="flex items-center gap-2">
                          <input type="file" ref={backInputRef} onChange={(e) => handleFileChange('back', e)} accept="image/*" className="hidden" />
                          <button type="button" onClick={() => backInputRef.current?.click()} className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            <Upload className="h-4 w-4 text-gray-500" /><span className="text-sm text-gray-600">{licenseBack ? licenseBack.name : 'Upload Back Image'}</span>
                          </button>
                          {licenseBack && (<button type="button" onClick={() => removeFile('back')} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><X className="h-4 w-4" /></button>)}
                        </div>
                        <p className="text-xs text-gray-500">Upload clear images of both sides (JPEG, PNG, max 5MB each)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2 pt-4">
                  <input type="checkbox" id="terms" name="terms" required className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="terms" className="text-sm text-gray-600">I agree to the <span className="text-blue-600 hover:underline cursor-pointer">terms and conditions</span> and <span className="text-blue-600 hover:underline cursor-pointer">privacy policy</span></label>
                </div>

                {/* Submit Button (Requests OTP) */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Requesting OTP...</>
                  ) : (
                    'Request Verification Code'
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <div className="flex items-center mb-4"><div className="flex-1 border-t border-gray-300"></div><span className="px-3 text-sm text-gray-500">OR</span><div className="flex-1 border-t border-gray-300"></div></div>
                <div className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button className="text-blue-600 hover:underline font-medium" onClick={() => window.location.href = '/login'}>Sign in</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}