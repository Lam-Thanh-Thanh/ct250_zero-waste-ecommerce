const Joi = require('joi');

/**
 * Validation schema cho đăng ký
 */
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Tên đăng nhập chỉ được chứa chữ và số',
      'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
      'string.max': 'Tên đăng nhập không được quá 30 ký tự',
      'any.required': 'Vui lòng nhập tên đăng nhập'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Vui lòng nhập email'
    }),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được quá 50 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'any.required': 'Vui lòng xác nhận mật khẩu'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)'
    }),
  
  address: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Địa chỉ không được quá 200 ký tự'
    })
});

/**
 * Validation schema cho đăng nhập
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Vui lòng nhập email'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Vui lòng nhập mật khẩu'
    })
});

/**
 * Validation schema cho cập nhật thông tin
 */
const updateProfileSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'Tên đăng nhập chỉ được chứa chữ và số',
      'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
      'string.max': 'Tên đăng nhập không được quá 30 ký tự'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)'
    }),
  
  address: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Địa chỉ không được quá 200 ký tự'
    })
});

/**
 * Validation schema cho đổi mật khẩu
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Vui lòng nhập mật khẩu hiện tại'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu mới không được quá 50 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu mới'
    }),
  
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'any.required': 'Vui lòng xác nhận mật khẩu mới'
    })
});

/**
 * Middleware validate request body
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
      stripUnknown: true // Loại bỏ các field không có trong schema
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    
    // Gán giá trị đã validate vào req.validatedBody
    req.validatedBody = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  validate
};