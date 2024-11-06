# Welcome to the On-Orbit Collision Predictor! 🚀

In this project, our team was commissioned by the Canadian Space Agency to develop a predictive system for on-orbit satellite collision risks. This tool helps assess potential orbital collisions using a blend of machine learning and advanced statistical models. The system allows users to input satellite data, calculate collision probabilities, and manage prediction reports. It's designed for space agencies, satellite operators, and researchers to improve decision-making and avoid costly or dangerous on-orbit collisions.

## 🧠 The Team:

| Member            | Position           | Responsibilities                   |
| ----------------- | ------------------ | ---------------------------------- |
| **Erik Cupsa**    | Full Stack + ML     | Technical leadership, ML models    |
| **Yassine Mimet** | Back End            | Django API and system architecture |
| **Wasif Somji**   | Full Stack          | Full-Stack Development, DevOps |
| **Masa Kagami**   | Front End + ML      | UI/UX design and ML integration    |

## 🚀 Key Features

### User Accounts
- **Registration & Login**: Users can create secure accounts to access the system.
- **Profile Management**: Users can update profile details and manage their account.

### Collision Prediction Functionality
- **Data Input**: Upload satellite information for collision risk assessments.
- **Prediction Results**: Generate collision predictions based on machine learning models.
- **Reports**: Save and manage prediction reports for further analysis.

### Admin Controls
- **User Management**: Admins can manage user accounts, including role assignments.
- **System Monitoring**: Admins can monitor prediction usage and system performance.

## 🛠️ Tech Stack

- **Backend**: Django
- **Machine Learning**: MATLAB for initial calculations, Python (scikit-learn) for machine learning model development
- **Frontend**: Next.js with Cesium for 3D visualization
- **Database**: PostgreSQL hosted on Supabase

## 📂 Project Structure

```plaintext
On-Orbit-Collision-Predictor/
│
├── on-orbit-frontend/             # Next.js frontend
│
├── Orbit_Predictor-BackEnd/       # Django backend
│   ├── api/                       # Django app with models, views, serializers, and URLs
│   └── orbit_predictor/           # Main project configuration files
│
├── env/                           # Python virtual environment
│
└── README.md                      # Project README
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** and **Django** for the backend
- **Node.js** and **npm** for the Next.js frontend
- **MATLAB** for initial prediction calculations (optional for extended functionality)
- **PostgreSQL** for database management
- **Supabase** for hosted database setup

### Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-repo/on-orbit-collision-predictor.git
   cd on-orbit-collision-predictor
   ```

2. **Install Dependencies**

   - **Backend**: Set up and activate the virtual environment, then install Django and other requirements.

     ```bash
     python3 -m venv env
     source env/bin/activate
     pip install -r requirements.txt
     ```

   - **Frontend**: Navigate to the `on-orbit-frontend` folder and install dependencies.

     ```bash
     cd on-orbit-frontend
     npm install
     ```

3. **Database Setup** (in progress)

   Set up a PostgreSQL database locally or use Supabase, then configure the database settings in `orbit_predictor/settings.py`:

   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'your_db_name',
           'USER': 'your_db_user',
           'PASSWORD': 'your_db_password',
           'HOST': 'your_db_host',
           'PORT': 'your_db_port',
       }
   }
   ```

4. **Environment Variables**

   Set up environment variables as needed for Django and Next.js. Consider adding them to `.env` files (e.g., `env/.env` for Django and `on-orbit-frontend/.env.local` for Next.js).

5. **Run Migrations**

   ```bash
   cd Orbit_Predictor-BackEnd
   python manage.py makemigrations
   python manage.py migrate
   ```

### Running the Project

To run both the Django backend and the Next.js frontend concurrently:

```bash
npm run dev
```

This command will start:
- **Next.js frontend** at `http://localhost:3000`
- **Django backend** at `http://localhost:8000`

## 🚀 Development Roadmap

### Phase 1: App Development
- **User Authentication**: Implement secure login and registration.
- **Basic Prediction Model**: Enable users to input data and generate collision predictions.
- **Admin Panel**: Develop basic admin functionalities.

### Phase 2: Enhanced Features
- **Prediction Accuracy**: Improve the collision prediction model using more sophisticated algorithms.
- **Report Management**: Enable detailed reports for users.
- **Notifications**: Add email notifications for high-risk predictions.

### Phase 3: Scalability & Optimization
- **Performance Optimization**: Ensure the system performs well under heavy data loads.
- **Security Enhancements**: Implement additional security measures.
- **Mobile App**: Develop a mobile version of the system for wider accessibility.

## 📚 Code Organization

### Backend

- `api/models.py`: Contains database models for `Conjunction`, `Collision`, and `ProbabilityCalc`.
- `api/serializers.py`: Serializes model data for JSON responses.
- `api/views.py`: Defines API views for creating and retrieving collision prediction data.
- `api/urls.py`: Routes API endpoints.

### Frontend

- `on-orbit-frontend/pages`: Contains Next.js page components.
- `on-orbit-frontend/components`: Shared components for UI.
- `on-orbit-frontend/utils`: Helper functions for API requests and data handling.

## 📞 Contact Us

For more information or to get involved, please contact:

- **Erik Cupsa**: [erik.cupsa@mail.mcgill.ca](mailto:erik.cupsa@mail.mcgill.ca)
- **Wasif Somji**: [wasif.somji@mail.mcgill.ca](mailto:wasif.somji@mail.mcgill.ca)

---

This `README.md` file should provide a comprehensive overview for collaborators or new contributors to the project. Let me know if you need further details or adjustments!
