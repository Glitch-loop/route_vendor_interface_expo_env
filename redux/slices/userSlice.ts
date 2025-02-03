import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../interfaces/interfaces';

const initialState: IUser = {
  id_vendor: '',
  cellphone: '',
  name: '',
  password: '',
  status: 0,
};


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      return {
        id_vendor: action.payload.id_vendor,
        name:      action.payload.name,
        cellphone: action.payload.cellphone,
        password:  action.payload.password,
        status:    action.payload.status,
      };
    },
    logoutUser: (state, action: PayloadAction<null>) => {
      return {
        id_vendor: '',
        name:      '',
        cellphone: '',
        password:  '',
        status:    1,
      }
    }
  },
});


export const { setUser, logoutUser } = userSlice.actions;

export default userSlice.reducer;
