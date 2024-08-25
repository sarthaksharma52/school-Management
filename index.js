const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/school_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB...', err));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // To handle URL-encoded data

// School Schema
const schoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});

const School = mongoose.model('School', schoolSchema);

// Home Route - Renders the main form page
app.get('/', async (req, res) => {
    res.render('index',{ schools: null });
});

// Add School API - Handles the POST request
app.post('/addSchool', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const newSchool = new School({ name, address, latitude, longitude });
        await newSchool.save();
        res.redirect('/'); // Redirect to the homepage after adding the school
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List Schools API - Handles the GET request
app.get('/listSchools', async (req, res) => {
    const { latitude, longitude } = req.query;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
        const schools = await School.find();

        // Calculate distance for each school
        schools.forEach(school => {
            school.distance = calculateDistance(latitude, longitude, school.latitude, school.longitude);
        });

        // Sort schools by distance
        schools.sort((a, b) => a.distance - b.distance);

        res.render('index', { schools }); // Pass the list of schools to the EJS view
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to calculate the distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
