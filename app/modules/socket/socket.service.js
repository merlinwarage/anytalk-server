// Keep track of which names are used so that there are no duplicates
const userNames = ( () => {
    let names = {};

    const claim = name => {
        if ( !name || names[ name ] ) {
            return false;
        } else {
            names[ name ] = true;
            return true;
        }
    };

    // find the lowest unused "guest" name and claim it
    const getGuestName = () => {
        let name;
        let nextUserId = 1;

        do {
            name = 'Guest ' + nextUserId;
            nextUserId += 1;
        } while ( !claim( name ) );

        return name;
    };

    // serialize claimed names as an array
    const get = () => {
        let res = [];
        for ( user in names ) {
            res.push( user );
        }

        return res;
    };

    const free = name => {
        if ( names[ name ] ) {
            delete names[ name ];
        }
    };

    return {
        claim: claim,
        free: free,
        get: get,
        getGuestName: getGuestName
    };
} )();

module.exports = userNames;
