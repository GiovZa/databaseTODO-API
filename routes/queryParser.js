module.exports = {
    parseWhere: function (where) {
        try {
            return where ? JSON.parse(where) : {};
        } catch (error) {
            throw new Error('Invalid JSON format for "where" parameter');
        }
    },
    parseSort: function (sort) {
        try {
            return sort ? JSON.parse(sort) : {};
        } catch (error) {
            throw new Error('Invalid JSON format for "sort" parameter');
        }
    },
    parseSelect: function (select) {
        try {
            return select ? JSON.parse(select) : {};
        } catch (error) {
            throw new Error('Invalid JSON format for "select" parameter');
        }
    }
};