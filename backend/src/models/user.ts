import mongoose, { Query, Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

type ValidatorMessageProps<T = any> = {
  value: T;
  path: string;
};

const e164Regex = /^\+?[1-9]\d{9,14}$/;

const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^()[\]{}\-_=+|\\:;"'<>,./~`]).{8,}$/;

const userSchema = new Schema({
    firstname: {
        type: String,
        trim: true,
        lowercase: true,
        minlength: [3, 'firstname must be at least 3 characters long'],
        maxlength: [15, 'firstname cannot exceed 15 characters'],
        required: [true, 'First name is a required field.'],
         validate: {
      validator: function(v) {
        return /^[a-zA-Z'.-]*$/.test(v); // Allow alphanumeric, underscore, dot, and hyphen
      },
      message: props => `${props.value} is not a valid name!`
    }
    },

    lastname: {
        type: String,
        trim: true, 
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z'.-]*$/.test(v); // Allows only letters, apostrophe, dot, and hyphen
            },
            message: props => `${props.value} is not a valid name!`
            }
    },

    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [
      {
        validator: function(v: string) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: (props: ValidatorMessageProps<string>) => `${props.value} is not a valid email!`
      },
      
    {validator: (v: string) => !!v,
    message: "Email is required"

    }
    ]
  },

    photo: String,
    coverPhoto: String,
    password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    validate: {
      validator: function (v: string): boolean {
        return passwordRegex.test(v);
      },
      message:
        "Password must contain at least one letter, one number, and one special character"
    }
  },
    confirmPassword: {
        type: String,
        required: [true, 'Confirm Password is a required field.'],
        validate: {
            validator: function (value: string) {
                return value === this.password
            },
            message: 'Password & Confirm Password do not match.'
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ['user', 'admin', 'super'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    bio: {
        type: String,
        maxLength: 1000
    },
    address: {
        city: String,
        country: String
    },
    contact: {
        altEmail: {
            type: String,
            trim: true,
            lowercase: true,
           validate: {
      validator: function (v: string): boolean {
        return passwordRegex.test(v);
      },
      message:
        "Password must contain at least one letter, one number, and one special character"
    }
        },
        code:{
            type: String,
            default: '+91'
        },
        phone:{
            type: String,
            unique: true,
            validate: {
            validator: (v: string) => e164Regex.test(v),
            message: "Phone number must be in valid international format (e.g. +2348012345678)"
        }
            }
    },
    resetToken: String,
    resetTokenExpiresAt: Date
},
{
    methods: {
     
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  },

  async  isPasswordChanged (tokenIssuedAt) {
    if (this.passwordChangedAt) {
        const passwordChangeTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

        return tokenIssuedAt < passwordChangeTimestamp;
    }
    return false;
},

generateResetToken () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetTokenExpiresAt = new Date(Date.now() + (10 * 60 * 1000));

    console.log(resetToken, this.resetToken);

    return resetToken;
}

},
    
    timestamps: true}
) 


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.pre(/^find/, function (this: Query<any, any>) {
  this.where({ isActive: true });
});


module.exports = mongoose.model('User', userSchema);

