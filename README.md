# MindCare V2

A comprehensive mental health care mobile application built with React Native and Expo. MindCare connects users with mental health resources, therapists, and AI-powered support tools to improve mental wellness.

## 📱 Features

### User Features
- **Mental Health Assessment**: Take assessments to understand your mental health status
- **AI Chatbot**: 24/7 compassionate virtual mental health companion powered by Cohere AI
- **Appointment Booking**: Schedule appointments with professional therapists
- **Mental Health Resources**: Access curated mental health resources and materials
- **Community Forum**: Connect with other users, share experiences, and seek support
- **Home Dashboard**: Personalized home screen with quick access to all features

### Therapist Features
- **Therapist Dashboard**: Manage and monitor client activities
- **Appointments Management**: View and manage scheduled appointments with clients
- **Client Tracking**: Track client progress and appointments

### Admin Features
- **Admin Dashboard**: System-wide overview and management
- **User Management**: Manage users, therapists, and system resources
- **System Configuration**: Control and configure system features

### Authentication
- Secure authentication system with Supabase
- Support for user registration and login
- Role-based access control (User, Therapist, Admin)

## 🛠 Tech Stack

### Frontend
- **React Native 0.81.5** - Cross-platform mobile development
- **Expo 54.0.33** - Managed React Native framework
- **React Navigation 7.x** - Navigation library for mobile apps
- **React 19.1.0** - UI library

### Backend & Services
- **Supabase** - Backend as a Service (Authentication, Database, Real-time)
- **Cohere API** - AI-powered chatbot for mental health support

### Dependencies
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/native-stack` - Stack navigation
- `@react-native-async-storage/async-storage` - Local storage
- `@supabase/supabase-js` - Supabase client
- `expo-font` - Custom fonts
- `expo-linear-gradient` - Gradient components
- `@expo/vector-icons` - Icon library
- `react-native-gesture-handler` - Gesture handling
- `react-native-reanimated` - Animation library
- `react-native-screens` - Native screen management

## 📁 Project Structure

```
MindCare V2/
├── src/
│   ├── config/
│   │   └── supabase.js         # Supabase client configuration
│   ├── context/
│   │   └── AuthContext.js      # Authentication context and hooks
│   ├── data/
│   │   ├── assessmentQuestions.js  # Assessment data
│   │   ├── forumData.js            # Forum data
│   │   └── resources.js            # Mental health resources
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation structure
│   ├── screens/
│   │   ├── admin/              # Admin dashboard screens
│   │   ├── auth/               # Login and registration screens
│   │   ├── therapist/          # Therapist management screens
│   │   └── user/               # User feature screens
│   ├── theme/
│   │   └── theme.js            # Color, font, and spacing definitions
│   └── utils/
│       └── cohereApi.js        # Cohere AI chatbot integration
├── assets/                      # App icons, splash screens
├── App.js                       # Main app component
├── app.json                     # Expo configuration
├── package.json                 # Project dependencies
├── babel.config.js             # Babel configuration
├── index.js                     # App entry point
├── eas.json                     # Expo Application Services config
└── supabase-setup.sql          # Supabase database setup script
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- A mobile device or emulator (Android/iOS)
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   cd "MindCare V2"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - The Supabase configuration is in `src/config/supabase.js`
   - Update with your Supabase project URL and API key if needed

4. **Set up Supabase database**
   - Run the SQL script: `supabase-setup.sql` in your Supabase dashboard

### Running the App

#### Development Server
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS
```bash
npm run ios
```

#### Run on Web
```bash
npm run web
```

## 🤖 AI Chatbot Integration

MindCare includes an AI-powered chatbot using the Cohere API that provides:
- Empathetic listening and emotional validation
- Evidence-based coping strategies
- Mindfulness and breathing exercises
- Encouragement for healthy habits
- Crisis resource recommendations when needed

The chatbot is configured with safety guidelines to recognize when professional help is needed and never provides medical diagnoses.

## 🔐 Security Features

- Secure authentication via Supabase Auth
- Role-based access control
- Sensitive API keys managed through environment configuration
- Encrypted communication with backend services
- Local secure storage for user data

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `users` - User authentication and profiles
- `profiles` - Extended user profile information with role
- `assessments` - Mental health assessments
- `appointments` - Therapist appointments
- `forum_posts` - Community forum posts
- `resources` - Mental health resources

See `supabase-setup.sql` for detailed schema.

## 🎨 Theming

The app uses a cohesive design system defined in `src/theme/theme.js`:
- Custom color palette optimized for mental health app
- Consistent typography
- Standardized spacing
- Light mode UI

## 🧪 Testing

To test the app locally:
1. Start the development server: `npm start`
2. Choose your platform (android/ios/web)
3. Sign up with test credentials
4. Explore features in different user roles

## 📝 API Endpoints

### Supabase
- Authentication: Handled by Supabase Auth
- Database: Real-time data sync via Supabase
- Real-time subscriptions: Built-in support

### External APIs
- **Cohere API** - Mental health chatbot responses

## 🚀 Deployment

The app is configured for deployment via Expo Application Services (EAS):
- Build configuration: `eas.json`
- Supports automated iOS and Android builds
- Cloud-hosted builds and updates

## 🐛 Common Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| Supabase connection fails | Check API key and URL in `src/config/supabase.js` |
| Chatbot not responding | Verify Cohere API key in `src/utils/cohereApi.js` |
| Navigation not working | Ensure all screens are properly imported in `AppNavigator.js` |
| Assets not loading | Run `expo prebuild` or `npm install` again |

## 📚 Documentation

- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Cohere API Docs](https://docs.cohere.com)

## 👥 User Roles

### User
- Access personal dashboard
- Complete mental health assessments
- Chat with AI assistant
- Book appointments with therapists
- Browse community forum
- Access mental health resources

### Therapist
- View therapist dashboard
- Manage appointments
- View client information
- Track client progress

### Admin
- Full system access
- User management
- System configuration
- Monitor all activities

## 🔄 Architecture

The app follows a modular architecture:
- **Context API** for state management (Authentication)
- **React Navigation** for screen navigation
- **Component-based** UI structure
- **Supabase** for backend services
- **Async/await** for asynchronous operations

## 📄 License

This project is private and confidential.

## 🤝 Contributing

Team members should:
1. Follow the project structure
2. Use consistent naming conventions
3. Implement features in appropriate screen folders
4. Test on both iOS and Android before committing

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review component documentation
- Contact the development team

## 🎯 Future Enhancements

- [ ] Offline functionality
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Video consultation feature
- [ ] Prescription management
- [ ] Integration with wearable devices
- [ ] Multilingual support
- [ ] Advanced security features (biometric authentication)

---

**Version**: 1.0.0  
**Last Updated**: 2026  
**Created with**: React Native, Expo, and Supabase
