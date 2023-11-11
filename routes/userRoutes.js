var secrets = require('../config/secrets');
var User = require('../models/user');
var Task = require('../models/task'); 
const errorHandler = require('./errorHandler');
var queryParser = require('./queryParser');

module.exports = function (router) {

    // GET for users endpoint
    var userRoute = router.route('/users');
    userRoute.get(async function (req, res, next) {
        try {
            // Parse query parameters
            var where = queryParser.parseWhere(req.query.where);
            var sort = queryParser.parseSort(req.query.sort);
            var select = queryParser.parseSelect(req.query.select);
            var skip = parseInt(req.query.skip) || 0;
            var limit = parseInt(req.query.limit) || 0;
            var count = req.query.count === 'true';
    
            // Build the query
            var query = User.find(where).sort(sort).select(select).skip(skip);
            if (limit > 0) {
                query = query.limit(limit);
            }
    
            // Execute the query
            const users = await query.exec();
    
            // Return count if count parameter is true
            if (count) {
                const results = await query.exec();
                const countResult = results.length; // Count after applying skip and limit
                return res.status(200).json({ message: '200 OK', data: countResult });
            }
    
            // Guard clause for no users found
            if (users.length === 0) {
                return res.status(404).json({ message: '404 No Users Found', data: users });
            }
    
            // Return the list of users
            res.status(200).json({ message: '200 OK', data: users });
        } catch (err) {
            next(err);
        }
    });
    
    // POST for users endpoint
    userRoute.post(async function (req, res, next) {
        try {
            const newUser = new User(req.body);
            const user = await newUser.save();
            res.status(201).json({ message: '201 User Created', data: user });
        } catch (err) {
            next(err);
        }
    });

    // GET for users/:id endpoint
    var userByIdRoute = router.route('/users/:id');
    userByIdRoute.get(async function (req, res, next) {
        try {
            // Extract 'select' parameter from the query string
            var select = req.query.select ? queryParser.parseSelect(req.query.select) : {};
    
            // Find the user by ID and apply the 'select' condition
            const user = await User.findById(req.params.id).select(select);
    
            // Exit early if user ID does not exist
            if (!user) {
                return res.status(404).json({ message: '404 User Not Found', data: {} });
            } 

            // Display data if user ID exists
            res.status(200).json({ message: '200 OK', data: user });
            
        } catch (err) {
            next(err);
        }
    });
    
    // PUT for users/:id endpoint
    userByIdRoute.put(async function (req, res, next) {
        try {
            const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!user) {
                return res.status(404).json({ message: '404 User Not Found', data: {} });
            }
    
            // Check if pendingTasks are provided and is an array
            if (req.body.pendingTasks && Array.isArray(req.body.pendingTasks)) {
                // Update the assignedUser and assignedUserName in each Task
                const tasksUpdates = req.body.pendingTasks.map(taskId => 
                    Task.findByIdAndUpdate(taskId, { 
                        assignedUser: user._id, 
                        assignedUserName: user.name 
                    }, { new: true })
                );
    
                // Execute all the task updates
                await Promise.all(tasksUpdates);
    
                // Update user's pendingTasks
                user.pendingTasks = req.body.pendingTasks;
                await user.save();
            }
    
            res.status(200).json({ message: '200 User Updated', data: user });
        } catch (err) {
            next(err);
        }
    });

    // DELETE for users/:id endpoint
    userByIdRoute.delete(async function (req, res, next) {
        try {
            const user = await User.findByIdAndRemove(req.params.id);

            // Exit early if user ID does not exist
            if (!user) {
                return res.status(404).json({ message: '404 User Not Found', data: {} });
            } 

            // Delete if user ID exists
            await Task.updateMany({ _id: { $in: user.pendingTasks } }, { assignedUser: '', assignedUserName: 'unassigned' });
            res.status(200).json({ message: '200 User Deleted', data: user });

        } catch (err) {
            next(err);
        }
    });

    router.use(errorHandler);

    return router;
};