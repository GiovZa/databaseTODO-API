/*
 * Connect all of your endpoints together here.
 */
module.exports = function (app, router) {
  app.use('/api', require('./home.js')(router));
  app.use('/api/users', require('./userRoutes.js')(router));
  app.use('/api/users/:id', require('./userRoutes.js')(router));
  app.use('/api/tasks', require('./taskRoutes.js')(router));
  app.use('/api/tasks/:id', require('./taskRoutes.js')(router));
};
