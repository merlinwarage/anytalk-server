"use strict";
module.exports = {
    defaults: {
        imageAbsPath: 'public/build/assets/images/',
        imageRelPath: 'assets/images/',
        noImagePath: 'assets/images/image-not-available.jpg'
    },
    system: {
        envType: 'dev'
    },
    api: {
        v1: {
            message: {
                get: '/api/v1/message',                 //GET
                getOne: '/api/v1/message/:room/:id',    //GET
                paginate: '/api/v1/message/paginate',   //POST
                save: '/api/v1/message',                //POST
                vote: '/api/v1/message/vote',           //PUT
                update: '/api/v1/message',              //PUT
                delete: '/api/v1/message/:room/:id'     //DELETE
            },
            room: {
                getOne: '/api/v1/room/:id',                 //GET
                getOneByTitle: '/api/v1/room/title/:title', //GET
                getPrivates: '/api/v1/room/private',        //GET
                getHot: '/api/v1/room/hot',                 //GET
                getNew: '/api/v1/room/new',                 //GET
                getFeatured: '/api/v1/room/featured',       //GET
                getFavorites: '/api/v1/room/favorite',      //GET
                paginate: '/api/v1/room/paginate',          //POST
                save: '/api/v1/room',                       //POST
                update: '/api/v1/room/:id',                 //PUT
                delete: '/api/v1/room/:id',                 //DELETE
                saveMember: '/api/v1/room/members',         //POST
                getNews: '/api/v1/news'                     //POST
            },
            user: {
                get: '/api/v1/user',                            //GET
                getOne: '/api/v1/user/:id',                     //GET
                getActivities: '/api/v1/user/info/activities',  //GET
                updateFavorites: '/api/v1/user/favorites',      //POST
                removeFavorites: '/api/v1/user/favorites',      //PUT
                save: '/api/v1/user',                           //POST
                login: '/api/v1/user/login',                    //POST
                logout: '/api/v1/user/logout',                  //POST
                update: '/api/v1/user/:id',                     //PUT
                delete: '/api/v1/user/:id',                     //POST (inactivate)
                validate: '/api/v1/user/validate/:token'        //GET
            },
            maintainer: {
                isImage: '/api/v1/news/image',
                getNews: '/api/v1/news'
            }
        }
    },
    languages: {
        en_GB: 'en',
        en_US: 'us',
        hu_HU: 'hu'
    },
    newsApi: {
        apiServer: "http://localhost:8000/api/v1/news",
        apiKey: "3041cce0b34d47f58761b92813abf0c7",
        apiUrl: "https://newsapi.org/v1/articles",
        blacklist: [
            '_67165916_67165915.jpg',
            'ign-logo-100x100.jpg'
        ]
    },
    sourceListEn: {
        home: {
            source: "time",
            sortBy: 'top',
            title: 'General'
        },
        general: {
            source: "bbc-news",
            sortBy: 'top',
            title: 'General',
            protocol: 'http'
        },
        technology: {
            source: "techradar",
            sortBy: 'top',
            title: 'Tech'
        },
        sport: {
            source: "bbc-sport",
            sortBy: 'top',
            title: 'Sport',
            protocol: 'http'
        },
        music: {
            source: "mtv-news-uk",
            sortBy: 'top',
            title: 'Music'
        },
        science: {
            source: "new-scientist",
            sortBy: 'top',
            title: 'Science'
        },
        entertainment: {
            source: "entertainment-weekly",
            sortBy: 'top',
            title: 'Entertainment'
        },
        gaming: {
            source: "ign",
            sortBy: 'top',
            title: 'Gaming'
        },
        business: {
            source: "business-insider-uk",
            sortBy: 'top',
            title: 'Business'
        },
        social: {
            source: "daily-mail",
            sortBy: 'top',
            title: 'Social'
        }
    },

    //PCForum.hu - image embeded in description
    //Feed.load('http://pcforum.hu/site.pc/backend/pcforum-rss.xml', function(err, rss){
    //   console.log(rss);
    //});

    //Index.hu
    //http://index.hu/sport/rss/
    //http://index.hu/kulfold/rss/
    //http://index.hu/tech/rss/
    //http://index.hu/gazdasag/rss/
    //http://index.hu/tudomany/rss/
    //http://index.hu/kultur/cinematrix/rss/
    //http://index.hu/tech/godmode/rss/
    //http://index.hu/kultur/rss/
    //Feed.load('http://index.hu/24ora/rss/', function(err, rss){
    //   console.log(rss);
    //});

    //Origo.hu - noimage
    //http://www.origo.hu/contentpartner/rss/nagyvilag/origo.xml
    //http://www.origo.hu/contentpartner/rss/uzletinegyed/origo.xml
    //http://www.origo.hu/contentpartner/rss/sport/origo.xml
    //http://www.origo.hu/contentpartner/rss/tudomany/origo.xml
    //http://www.origo.hu/contentpartner/rss/techbazis/origo.xml
    //http://www.origo.hu/contentpartner/rss/filmklub/origo.xml
    //http://cimkezes.origo.hu/cimke_rss/techbazis-jatek.xml
    //http://cimkezes.origo.hu/cimke_rss/szorakozas.xml
    //Feed.load('http://www.origo.hu/contentpartner/rss/sport/origo.xml', function(err, rss){
    //   console.log(rss);
    //});

    //Gamestar.hu
    //https://www.gamestar.hu/site/rss/rss.xml
    //Feed.load('https://www.gamestar.hu/site/rss/rss.xml', function(err, rss){
    //   console.log(rss);
    //});

    //Gamekapocs.hu - noimage
    //https://www.gamekapocs.hu/rss

    sourceListHu: {
        home: {
            source: 'http://index.hu/24ora/rss/'
        },
        general: {
            source: "http://index.hu/kulfold/rss/"
        },
        technology: {
            source: "http://index.hu/tech/rss/"
        },
        science: {
            source: "http://index.hu/tudomany/rss/"
        },
        sport: {
            source: "http://index.hu/sport/rss/"
        },
        music: {
            source: "http://index.hu/kultur/zene/rss/"
        },
        entertainment: {
            source: "http://index.hu/kultur/rss/"
        },
        gaming: {
            source: "http://hu.ign.com/feed.xml" //http://index.hu/tech/godmode/rss/
        },
        business: {
            source: "http://index.hu/gazdasag/rss/"
        },
        social: {
            source: "http://velvet.hu/24ora/rss/"
        }
    },
    permissions: {
        admin: 10,
        user: 1
    }
};