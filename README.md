a vote base on [firebase](https://www.firebase.com/)
===================
### feature
- no sql, data base on firebase, demo data file: data.json, please import the file to your firebase app and update the URL to yours in `default/main.js` line 27:

`javascript
var myFirebaseRef = new Firebase('https://your-app-name.firebaseio.com/');
`
- voted state would log in cookie

### some main function/moudle in `default/main.js`
- `getVoteList` for mobile
- `getPcVoteList` for pc
- `getResult` render vote result
- `voteCookie.setCookie('voted', 'yes', 1)`, 1 means one day
