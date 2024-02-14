import { createSlice} from '@reduxjs/toolkit';

const initialState ={
    currentUser:null,
    loading:false
}

const UserSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.currentUser = action.payload;
        },
        loginProgress: (state) => {
            state.loading = true;
        },
        loginFailure: (state) => {
            state.loading = false;
        },
        loginSuccess: (state) =>{
            state.loading = false ;
        },
        logout: (state) => {
            state.currentUser = null;
        },
        
    },
});


export const { login, loginProgress, loginFailure, logout , loginSuccess } = UserSlice.actions;

export default UserSlice.reducer;