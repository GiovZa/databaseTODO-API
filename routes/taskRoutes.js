var secrets = require('../config/secrets');
var Task = require('../models/task');
var User = require('../models/user'); 
const errorHandler = require('./errorHandler');
var queryParser = require('./queryParser');

module.exports = function (router) {

    // GET for tasks endpoint
    var taskRoute = router.route('/tasks');
    taskRoute.get(async function (req, res, next) {
        try {
            // Parse query parameters
            var where = queryParser.parseWhere(req.query.where);
            var sort = queryParser.parseSort(req.query.sort);
            var select = queryParser.parseSelect(req.query.select);
            var skip = parseInt(req.query.skip) || 0;
            var limit = parseInt(req.query.limit) || 0;
            var count = req.query.count === 'true';
    
            // Build the query
            var query = Task.find(where).sort(sort).select(select).skip(skip);
            if (limit > 0) {
                query = query.limit(limit);
            }
    
            // Execute the query
            const tasks = await query.exec();
    
            // Return count if count parameter is true
            if (count) {
                const results = await query.exec();
                const countResult = results.length; // Count after applying skip and limit
                return res.status(200).json({ message: '200 OK', data: countResult });
            }
    
            // Guard clause for no tasks found
            if (tasks.length === 0) {
                return res.status(404).json({ message: '404 No tasks Found', data: tasks });
            }
    
            // Return the list of tasks
            res.status(200).json({ message: '200 OK', data: tasks });
        } catch (err) {
            next(err);
        }
    });

    // POST for tasks endpoint
    taskRoute.post(async function (req, res, next) {
        try {
            const newTask = new Task(req.body);
            const task = await newTask.save();
            res.status(201).json({ message: '201 Task Created', data: task });
        } catch (err) {
            next(err);
        }
    });

    // GET for tasks/:id endpoint
    var taskByIdRoute = router.route('/tasks/:id');
    taskByIdRoute.get(async function (req, res, next) {
        try {
            // Extract 'select' parameter from the query string
            var select = req.query.select ? queryParser.parseSelect(req.query.select) : {};
    
            // Find the task by ID and apply the 'select' condition
            const task = await Task.findById(req.params.id).select(select);
    
            // Exit early if task does not exist
            if (!task) {
                return res.status(404).json({ message: '404 Task Not Found', data: {} });
            }

            // Display early if task exists
            res.status(200).json({ message: '200 OK', data: task });

        } catch (err) {
            next(err);
        }
    });

    // PUT for tasks/:id endpoint
    taskByIdRoute.put(async function (req, res, next) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ message: '404 Task Not Found', data: {} });
            }
    
            if (req.body.assignedUser) {
                const newUserId = req.body.assignedUser;
                const newUser = await User.findById(newUserId);
                if (!newUser) {
                    return res.status(404).json({ message: '404 User Not Found', data: {} });
                }
    
                // Remove task from previous user's pendingTasks if it was assigned
                if (task.assignedUser && task.assignedUser.toString() !== newUserId) {
                    const prevUser = await User.findById(task.assignedUser);
                    if (prevUser) {
                        prevUser.pendingTasks.pull(task._id);
                        await prevUser.save();
                    }
                }
    
                // Add task to new user's pendingTasks
                if (!newUser.pendingTasks.includes(task._id)) {
                    newUser.pendingTasks.push(task._id);
                    await newUser.save();
                }
    
                // Update task details including assignedUser
                Object.assign(task, req.body, { assignedUser: newUser._id, assignedUserName: newUser.name });
                await task.save();
            } else {
                // Update task without changing assignedUser
                Object.assign(task, req.body);
                await task.save();
            }
    
            res.status(200).json({ message: '200 Task Updated', data: task });
        } catch (err) {
            next(err);
        }
    });
    

    // DELETE for tasks/:id endpoint
    taskByIdRoute.delete(async function (req, res, next) {
        try {
            const task = await Task.findByIdAndRemove(req.params.id);

            // Exit if task does not exist
            if (!task) {
                return res.status(404).json({ message: '404 Task Not Found', data: {} });
            }
    
            // Quick delete if there is no assigned user
            if (!task.assignedUser) {
                return res.status(200).json({ message: '200 Task Deleted', data: task });
            }
    
            // If assigned user is missing, throw error
            const user = await User.findById(task.assignedUser);
            if (!user) {
                return res.status(404).json({ message: '404 User Not Found', data: {} });
            }
    
            // Delete task from tasks schema and pending task for assigned user
            user.pendingTasks.pull(task._id);
            await user.save();
            res.status(200).json({ message: '200 Task Deleted', data: task });
        } catch (err) {
            next(err);
        }
    });
    
    
    router.use(errorHandler);
    
    return router;
};