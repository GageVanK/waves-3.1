
import { useEffect, useState, useContext } from "react";


import { Player } from "@livepeer/react";
import {
  IconScreenShare,
  IconCheck,
  IconHeartHandshake,
  IconX,
} from "@tabler/icons-react";
import { GiWaveCrest } from "react-icons/gi";
import {
  getFollowersForUser,
  
  getPostsForUser,
  getNFTsForUser,
  getSingleProfile,
  updateFollowingStatus,
  getIsFollowing,
  identity,
  sendDeso,
  getExchangeRates,
} from "deso-protocol";
import {
  Grid,
  Container,
  ThemeIcon,
  CopyButton,
  Box,
  Overlay,
  Avatar,
  Paper,
  Group,
  Text,
  Card,
  Space,
  Modal,
  Center,
  Divider,
  Image,
  Tabs,
  Badge,
  ActionIcon,
  Tooltip,
  Button,
  Loader,
  Collapse,
  UnstyledButton,
  List,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { DeSoIdentityContext } from "react-deso-protocol";
import { RiUserUnfollowLine } from "react-icons/ri";
import { useDisclosure } from "@mantine/hooks";
import { TiInfoLargeOutline } from 'react-icons/ti';
import { useRouter } from 'next/router'
import { Chat } from '@/components/Chat';
import classes from './wave.module.css';
import Post from "@/components/Post";
import { replaceURLs } from "../../helpers/linkHelper";

export default function Wave() {
  const router = useRouter();
  const { userName } = router.query;
  const [posts, setPosts] = useState([]);
  const [NFTs, setNFTs] = useState([]);
  const [profile, setProfile] = useState([]);
  const [followerInfo, setFollowers] = useState({ followers: 0, following: 0 });
  const { currentUser } = useContext(DeSoIdentityContext);
  const [isFollowingUser, setisFollowingUser] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [openedSub1, { toggle: toggleSub1 }] = useDisclosure(false);
  const [openedSub2, { toggle: toggleSub2 }] = useDisclosure(false);
  const [openedSub3, { toggle: toggleSub3 }] = useDisclosure(false);
  const [openedSub, { open: openSub, close: closeSub }] = useDisclosure(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [openedChat, { toggle }] = useDisclosure(true);
  const [livestreamPost, setLivestreamPost] = useState(null); 
  const [isLoadingLivestream, setIsLoadingLivestream] = useState(false);

  const extractPlaybackId = (url) => {
    const match = url.match(/https:\/\/lvpr\.tv\/\?v=(.*)/);
    const playbackId = match ? match[1] : null;
    return playbackId;
  };
 
  // Get Profile For userName
  const fetchProfile = async () => {
    try {
      const profileData = await getSingleProfile({
        Username: userName,
        NoErrorOnMissing: true,
      });
      
      setProfile(profileData.Profile);
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };
 
  // Get Follow Counts for userName
  const fetchFollowerInfo = async () => {
    try {
      const following = await getFollowersForUser({
        Username: userName,
      });
      const followers = await getFollowersForUser({
        Username: userName,
        GetEntriesFollowingUsername: true,
      });

      setFollowers({ following, followers });
    } catch (error) {
      console.error("Error fetching follower information:", error);
    }
  };

  
  // Get For Sale NFTs
  const fetchNFTs = async (limit) => {
    try {
      setIsLoadingNFTs(true);
      const nftData = await getNFTsForUser({
        UserPublicKeyBase58Check: profile.PublicKeyBase58Check,
        IsForSale: true,
      });
      
      const nftKeys = Object.keys(nftData.NFTsMap);
      const limitedNFTKeys = nftKeys.slice(0, limit);

      const limitedNFTs = limitedNFTKeys.reduce((result, key) => {
        result[key] = nftData.NFTsMap[key];
        return result;
      }, {});

      setNFTs(limitedNFTs);
      setIsLoadingNFTs(false);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
    }
  };

  // Get Posts
  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const postData = await getPostsForUser({
        Username: userName,
        NumToFetch: 100,
      });
      setPosts(postData.Posts);
      setIsLoadingPosts(false);

    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

 

  // Get if Logged In User follows userName
  const getIsFollowingData = async () => {
    try {
      
      const req = {
        PublicKeyBase58Check: currentUser?.PublicKeyBase58Check,
        IsFollowingPublicKeyBase58Check: profile?.PublicKeyBase58Check,
      }

      const result = await getIsFollowing(req);
      setisFollowingUser(result.IsFollowing);
     
    
    } catch (error) {
      console.error("Error checking if following:", error);
    } 
  };

  

  // Function to Follow userName
  const followUser = async () => {
    try {
      
      
            await updateFollowingStatus({
              MinFeeRateNanosPerKB: 1000,
              IsUnfollow: false,
              FollowedPublicKeyBase58Check: profile?.PublicKeyBase58Check,
              FollowerPublicKeyBase58Check: currentUser?.PublicKeyBase58Check,
            });
            getIsFollowingData();
            notifications.show({
              title: "Success",
              icon: <IconCheck size="1.1rem" />,
              color: "green",
              message: `You successfully followed ${userName}`,
            }); 
         
        } catch (error) {
            notifications.show({
              title: "Error",
              icon: <IconX size="1.1rem" />,
              color: "red",
              message: `Something Happened: ${error}`,
            });
          
          }
  };

  // Function to Unfollow userName
  const unfollowUser = async () => {
    try {
    await updateFollowingStatus({
      MinFeeRateNanosPerKB: 1000,
      IsUnfollow: true,
      FollowedPublicKeyBase58Check: profile.PublicKeyBase58Check,
      FollowerPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
    });
    getIsFollowingData();
    notifications.show({
      title: "Success",
      icon: <IconCheck size="1.1rem" />,
      color: "red",
      message: `You successfully unfollowed ${userName}`,
    });
  } catch (error) {
    notifications.show({
      title: "Error",
      icon: <IconX size="1.1rem" />,
      color: "red",
      message: "Something Happened!",
    });
   
  }
  };

  // Getting userName's most recent Wave livestream
  const fetchLivestreamPost = async () => {
    try {
      setIsLoadingLivestream(true);
  
      const postData = await getPostsForUser({
        Username: userName,
        NumToFetch: 20,
      });
  
      const livestreamPost = postData.Posts.find(
        (post) => post.PostExtraData?.WavesStreamTitle
      );
  
      setLivestreamPost(livestreamPost);
      
      setIsLoadingLivestream(false);
    } catch (error) {
      console.error("Error fetching livestream post:", error);
    }
  };

  const subTier1 = async () => {
    try {
      const exchangeRateData = await getExchangeRates({
        PublicKeyBase58Check: profile.PublicKeyBase58Check,
      });
    

      const subscriptionAmount = 5; // $5 USD
      const usdCentsPerDeSoExchangeRate =
        exchangeRateData.USDCentsPerDeSoCoinbase;
      const nanosPerDeSo = 0.000000001; // 1 Nano is 0.000000001 DeSo

      // Calculate the equivalent amount in DeSo
      const equivalentDeSoAmount =
        (subscriptionAmount * 100) / usdCentsPerDeSoExchangeRate;

      // Calculate the equivalent amount in Nanos
      const equivalentNanosAmount = Math.floor(
        equivalentDeSoAmount / nanosPerDeSo
      );

      // Convert to an integer
      const equivalentNanosInt = Number(equivalentNanosAmount);

      await sendDeso({
        SenderPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        RecipientPublicKeyOrUsername: profile.PublicKeyBase58Check,
        AmountNanos: equivalentNanosInt,
        MinFeeRateNanosPerKB: 1000,
      });

      notifications.show({
        title: "Subcribed",
        icon: <IconCheck size="1.1rem" />,
        color: "green",
        message: `You successfully subscribed to ${userName}`,
      });
    } catch (error) {
      if (error.message.includes("RuleErrorInsufficientBalance")) {
        notifications.show({
          title: "Insufficient Balance",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Hey there, please add DeSo to your Wallet to complete this transaction.",
        });
      } else {
        notifications.show({
          title: "Error",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Something Happened!",
        });
        console.error("Error submitting transaction:", error);
      }
    }
  };

  const subTier2 = async () => {
    try {
      const exchangeRateData = await getExchangeRates({
        PublicKeyBase58Check: profile.PublicKeyBase58Check,
      });
     

      const subscriptionAmount = 15; // $5 USD
      const usdCentsPerDeSoExchangeRate =
        exchangeRateData.USDCentsPerDeSoCoinbase;
      const nanosPerDeSo = 0.000000001; // 1 Nano is 0.000000001 DeSo

      // Calculate the equivalent amount in DeSo
      const equivalentDeSoAmount =
        (subscriptionAmount * 100) / usdCentsPerDeSoExchangeRate;

      // Calculate the equivalent amount in Nanos
      const equivalentNanosAmount = Math.floor(
        equivalentDeSoAmount / nanosPerDeSo
      );

      // Convert to an integer
      const equivalentNanosInt = Number(equivalentNanosAmount);

      await sendDeso({
        SenderPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        RecipientPublicKeyOrUsername: profile.PublicKeyBase58Check,
        AmountNanos: equivalentNanosInt,
        MinFeeRateNanosPerKB: 1000,
      });

      notifications.show({
        title: "Subcribed",
        icon: <IconCheck size="1.1rem" />,
        color: "red",
        message: `You successfully subscribed to ${userName}`,
      });
    } catch (error) {
      if (error.message.includes("RuleErrorInsufficientBalance")) {
        notifications.show({
          title: "Insufficient Balance",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Hey there, please add DeSo to your Wallet to complete this transaction.",
        });
      } else {
        notifications.show({
          title: "Error",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Something Happened!",
        });
        console.error("Error submitting transaction:", error);
      }
    }
  };

  const subTier3 = async () => {
    try {
      const exchangeRateData = await getExchangeRates({
        PublicKeyBase58Check: profile.PublicKeyBase58Check,
      });
    

      const subscriptionAmount = 25; // $25 USD
      const usdCentsPerDeSoExchangeRate =
        exchangeRateData.USDCentsPerDeSoCoinbase;
      const nanosPerDeSo = 0.000000001; // 1 Nano is 0.000000001 DeSo

      // Calculate the equivalent amount in DeSo
      const equivalentDeSoAmount =
        (subscriptionAmount * 100) / usdCentsPerDeSoExchangeRate;

      // Calculate the equivalent amount in Nanos
      const equivalentNanosAmount = Math.floor(
        equivalentDeSoAmount / nanosPerDeSo
      );

      // Convert to an integer
      const equivalentNanosInt = Number(equivalentNanosAmount);

      await sendDeso({
        SenderPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        RecipientPublicKeyOrUsername: profile.PublicKeyBase58Check,
        AmountNanos: equivalentNanosInt,
        MinFeeRateNanosPerKB: 1000,
      });
      notifications.show({
        title: "Subcribed",
        icon: <IconCheck size="1.1rem" />,
        color: "green",
        message: `You successfully subscribed to ${userName}`,
      });
    } catch (error) {
      if (error.message.includes("RuleErrorInsufficientBalance")) {
        notifications.show({
          title: "Insufficient Balance",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Hey there, please add DeSo to your Wallet to complete this transaction.",
        });
      } else {
        notifications.show({
          title: "Error",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message:
            "Something Happened!",
        });
        console.error("Error submitting transaction:", error);
      }
    }
  };

  useEffect(() => {
    if(userName) {
      fetchPosts(); 
      fetchLivestreamPost();
      fetchProfile();
      fetchFollowerInfo();
    }
  }, [userName]);

  useEffect(() => {
    if(profile.PublicKeyBase58Check) {
    fetchNFTs(25); 
    }
  }, [profile.PublicKeyBase58Check]);

  useEffect(() => {
    if (profile?.PublicKeyBase58Check && currentUser?.PublicKeyBase58Check) {
      getIsFollowingData();
    }
  }, [currentUser?.PublicKeyBase58Check, profile?.PublicKeyBase58Check]);
  

  return (
    <>
      <Card ml={17} shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
          <Image
            src={profile?.ExtraData?.FeaturedImageURL || null}
            height={200}
            fallbackSrc="https://images.deso.org/4903a46ab3761c5d8bd57416ff411ff98b24b35fcf5480dde039eb9bae6eebe0.webp"
          />
        </Card.Section>

        <Center>
          <Avatar
            size={80}
            radius={80}
            src={
              `https://node.deso.org/api/v0/get-single-profile-picture/${profile?.PublicKeyBase58Check}` ||
              profile?.ExtraData?.LargeProfilePicURL || null
            }
            alt="Profile Picture"
            mx="auto"
            mt={-30}
         
          />
        </Center>

        <Center>
          {profile !== null ? (
            <>
              <Text className={classes.Avatar} fz="lg" fw={777} variant="gradient" truncate>
                {userName}
              </Text>
            </>
          ) : (
            <Text fz="lg" fw={777} variant="gradient" truncate>
              User does not exist
            </Text>
          )}
        </Center>

        <Space h="md" />
        <Card.Section>
          {isLoadingLivestream ? ( 

              <Group justify="center">
              <Loader size="sm" />
              </Group>
          ) : livestreamPost ? (
            <>
           

           <Player

              priority 
              controls
              showPipButton
              theme={{
                  colors: {
                    loading: '#3cdfff',
                  }
                }}
              playbackId={extractPlaybackId(livestreamPost.VideoURLs[0])}
              title={livestreamPost.ExtraData?.WavesStreamTitle}
              
            />
            
            </>
            
          ) : (
            <Divider
              my="xs"
              label={
                <>
                  <Paper radius="sm" p="md" withBorder>
                    <Text c="dimmed" fw={500} fs="md">
                      Not live right now.
                    </Text>
                  </Paper>
                </>
              }
              labelPosition="center"
            />
          )}
        </Card.Section>
        <Space h="md" />

        <Space h="md" />

        <Paper shadow="xl" radius="md" p="xl">
          <Group>
            <CopyButton
              value={`https://desowaves.vercel.app/wave/${userName}`}
              timeout={2000}
            >
              {({ copied, copy }) => (
                <Button
                  size="sm"
                  color={copied ? "teal" : "blue"}
                  onClick={copy}
                >
                  {copied ? (
                    <>
                      <Tooltip label="Copied Wave">
                        <IconCheck size={16} />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip label="Share their Wave with this Link">
                        <IconScreenShare size={16} />
                      </Tooltip>
                    </>
                  )}
                </Button>
              )}
            </CopyButton>

            <Button rightSection={<GiWaveCrest size="1rem" />} onClick={openSub}>
              Subscribe
            </Button>
            <Modal
              size="auto"
              opened={openedSub}
              onClose={closeSub}
              centered
              transitionProps={{ transition: "fade" }}
            >
              <Paper shadow="xl" p="xl" withBorder>
             
                <Space h="xs" />
                <Text fz="xl" fw={700} c="dimmed" ta="center" variant="gradient"
      gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>
                  {" "}
                  Join {userName}'s Wave
                </Text>
                <Text fz="xl" fw={700} c="dimmed" ta="center" variant="gradient"
      gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>
                  {" "}
                  Subscribe to contribute to their
                  growth
                </Text>
                <Space h="md" />
                
                <Space h="md" />
                <Center>
                  <Box>
                    <Grid>
                      <Grid.Col lg={4} sm={7}>
                        <Paper shadow="xl" p="xl" withBorder>
                          <List>
                            <Text fw={700} ta="center">
                              Tier 1
                            </Text>
                            <Divider my="sm" />
                            <Space h="md" />
                            <List.Item>
                              <Text size="xs">1 Month Subcription</Text>
                            </List.Item>
                            <List.Item>
                              <Text size="xs">1 Month Subscriber Badge</Text>
                            </List.Item>
                        
                            <List.Item>
                              <Text size="xs">1 Month Subscriber NFT</Text>
                            </List.Item>
                            <List.Item>
                            <Text size="xs">{`1 ${userName} Points`}</Text>
                            </List.Item>
                            
                          </List>
                          <Space h="md" />
                          <Center>
                        
       
                            <Button
                              onClick={toggleSub1}
                              variant="default"
                              radius="md"
                              fullWidth
                            >
                              $5.00
                            </Button>
                         
                          </Center>
                          <Space h="md" />
                          <Collapse in={openedSub1}>
                         
                          <Paper shadow="xl" radius="xl" p="xl" withBorder>
                          
                            <Center>
                            <Text fz="sm"  fw={500}>Confirm Purchase</Text>
                          
                       
                            </Center>
                            <Space h="xs" />
                            <Text ta="center" fz="xs"  fw={500} c="dimmed"><ThemeIcon radius="xl" size={14} variant="outline">
                              <TiInfoLargeOutline    />
     </ThemeIcon> This will instantly be paid out to {`${userName}`}</Text>
                           
                            <Divider my="sm" />
                         
                           
                          
                            <Button
                              onClick={subTier1}
                              variant="light"
                              radius="md"
                              fullWidth
                              leftIcon={<IconHeartHandshake size="1.5rem"  />}
                            >
                              Subscribe
                            </Button>
                             
                           
                       
                           
                            </Paper>
                        </Collapse>
                        </Paper>
                      </Grid.Col>
                      <Grid.Col lg={4} sm={7}>
                        <Paper shadow="xl" p="xl" withBorder>
                          <List>
                            <Text fw={700} ta="center">
                              Tier 2
                            </Text>
                            <Divider my="sm" />
                            <Space h="md" />
                            <List.Item>
                              <Text size="xs">3 Month Subcription</Text>
                            </List.Item>
                            <List.Item>
                              <Text size="xs">3 Month Subscriber Badge</Text>
                            </List.Item>
                         
                            <List.Item>
                              <Text size="xs">3 Month Subscriber NFT</Text>
                            </List.Item>
                            <List.Item>
                            <Text size="xs">{`3 ${userName} Points`}</Text>
                            </List.Item>
                          </List>
                          <Space h="md" />
                          <Center>
                            <Button
                              onClick={toggleSub2}
                              variant="default"
                              radius="md"
                              fullWidth
                            >
                              $15.00
                            </Button>
                          </Center>
                          <Space h="md" />
                          <Collapse in={openedSub2}>
                          <Paper shadow="xl" radius="xl" p="xl" withBorder>
                             <Center>
                            <Text fz="sm" fw={500}>Confirm Purchase</Text>
                            </Center>
                            <Space h="xs" />
                            <Text ta="center" fz="xs"  fw={500} c="dimmed"><ThemeIcon radius="xl" size={14} variant="outline">
                              <TiInfoLargeOutline    />
     </ThemeIcon> This will instantly be paid out to {`${userName}`}</Text>
                           
                            <Divider my="sm" />
                        
                     
                            <Button
                            fullWidth
                              onClick={subTier2}
                              variant="light"
                              radius="md"
                              leftIcon={<IconHeartHandshake size="1.5rem"  />}
                            >
                              Subscribe
                            </Button>
                    
                                                       
                            </Paper>
                        </Collapse>
                        </Paper>
                      </Grid.Col>
                      <Grid.Col lg={4} sm={7}>
                        <Paper shadow="xl" p="xl" withBorder>
                          <List>
                            <Text fw={700} ta="center">
                              Tier 3
                            </Text>
                            <Divider my="sm" />
                            <Space h="md" />
                            <List.Item>
                              <Text size="xs">6 Month Subcription</Text>
                            </List.Item>
                            <List.Item>
                              <Text size="xs">6 Month Subscriber Badge</Text>
                            </List.Item>
                            <List.Item>
                              <Text size="xs">6 Month Subscriber NFT</Text>
                            </List.Item>
                   
                            <List.Item>
                            <Text size="xs">{`6 ${userName} Points`}</Text>
                            </List.Item>
                          </List>
                          <Space h="md" />
                          <Center>
                            <Button
                              onClick={toggleSub3}
                              variant="default"
                              radius="md"
                              fullWidth
                            >
                              $25.00
                            </Button>
                          </Center>
                          <Space h="md" />
                          <Collapse in={openedSub3}>
                          <Paper shadow="xl"  radius="xl" p="xl" withBorder>
                             <Center>
                            <Text fz="sm" fw={500}>Confirm Purchase</Text>
                            </Center>
                            <Space h="xs" />
                            <Text ta="center" fz="xs"  fw={500} c="dimmed"><ThemeIcon radius="xl" size={14} variant="outline">
                              <TiInfoLargeOutline    />
     </ThemeIcon> This will instantly be paid out to {`${userName}`}</Text>
                           
                            <Divider my="sm" />
                        
                       
                            <Button
                              onClick={subTier3}
                              variant="light"
                              radius="md"
                              fullWidth
                              leftIcon={<IconHeartHandshake size="1.5rem"  />}
                            >
                              Subscribe
                            </Button>
                            
                           
                            
                            </Paper>
                        </Collapse>

                        
                        </Paper>
                      </Grid.Col>
                    </Grid>
                    
                    {currentUser &&
                      profile &&
                      currentUser.PublicKeyBase58Check ===
                        profile.PublicKeyBase58Check && (
                        <Overlay center>
                          <Container size="md" px={0}>
                            <Space h={77} />
                            <Paper shadow="xl" p="lg" withBorder>
                              <Text fw={500}>
                                Can't Subscribe to yourself. Switch Accounts to
                                Subscribe!
                              </Text>
                              <Divider my="sm" />
                              <Button
                                leftIcon={<GiWaveCrest size="1rem" />}
                                variant="gradient"
                                gradient={{ from: "cyan", to: "indigo" }}
                                onClick={() => identity.login()}
                                fullWidth
                              >
                                Switch Account
                              </Button>
                            </Paper>
                          </Container>
                        </Overlay>
                      )}

                    {!currentUser && (
                      <Overlay center>
                        <Container size="md" px={0}>
                          <Space h={77} />
                          <Paper shadow="xl" p="lg" withBorder>
                            <Text fw={500}>
                              Please Signup or Sign In to Subscribe.
                            </Text>
                            <Divider my="sm" />
                            <Button
                              leftIcon={<GiWaveCrest size="1rem" />}
                              variant="gradient"
                              gradient={{ from: "cyan", to: "indigo" }}
                              onClick={() => identity.login()}
                              fullWidth
                            >
                              Sign Up
                            </Button>
                            <Space h="sm" />
                            <Button
                              fullWidth
                              variant="default"
                              onClick={() => identity.login()}
                            >
                              Sign In
                            </Button>
                          </Paper>
                        </Container>
                      </Overlay>
                    )}
                  </Box>
                </Center>
              </Paper>
            </Modal>
          </Group>
          <Space h="sm" />
          <Text
            fz="sm"
            style={{
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "wrap",
            }}
            dangerouslySetInnerHTML={{
              __html:
                profile && profile.Description
                  ? replaceURLs(profile.Description.replace(/\n/g, "<br>"))
                  : "",
            }}
          />
        </Paper>

        <Space h="sm" />

        <Center>
          {followerInfo.followers && followerInfo.followers.NumFollowers ? (
            <Text fz="sm">
              Followers: {followerInfo.followers.NumFollowers}
            </Text>
          ) : (
            <Text fz="sm">Followers: 0</Text>
          )}

          <Space w="sm" />
          <Divider size="sm" orientation="vertical" />
          <Space w="sm" />
          {followerInfo.following && followerInfo.following.NumFollowers ? (
            <Text fz="sm">
              Following: {followerInfo.following.NumFollowers}
            </Text>
          ) : (
            <Text fz="sm">Following: 0</Text>
          )}
        </Center>
        <Space h="md" />
        <Space h="md" />
        {currentUser ? (
          isFollowingUser ? (
            <Group wrap="nowrap" gap={1}>
              <Button
                fullWidth
                variant="gradient"
                gradient={{ from: "cyan", to: "indigo" }}
                className={classes.button}
              >
                Following
              </Button>
              <Tooltip
                label="Unfollow User"
                
                withArrow
                arrowPosition="center"
              >
                <ActionIcon
                  variant="filled"
                  color="indigo"
                  size={36}
                 
                  onClick={unfollowUser}
                >
                  <RiUserUnfollowLine size="1rem" stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ) : (
            <Button
              fullWidth
              variant="gradient"
              gradient={{ from: "cyan", to: "indigo" }}
              radius="md"
              onClick={followUser}
            >
              Follow
            </Button>
          )
        ) : (
          <Button
            fullWidth
            variant="gradient"
            gradient={{ from: "cyan", to: "indigo" }}
            radius="md"
            onClick={() => identity.login()}
          >
            Sign In to Follow
          </Button>
        )}
      </Card>

      <Space h="sm"/>
            <Center>
              <Button variant="light" hiddenFrom="md" onClick={toggle}>
               {openedChat ? (
                <>
                Close Chat
                </>
               ):(
                <>
                Open Chat
                </>
               )}

              </Button>
            </Center>
              <Group justify="center" hiddenFrom="md">

                <Collapse transitionDuration={1000} transitionTimingFunction="smooth" in={openedChat}>
                  <Chat handle={userName || "Anon"} />
                </Collapse>

              </Group>

          <Space h="xl" />
       

      <Tabs variant="default" defaultValue="first">
        <Tabs.List grow >
          <Tabs.Tab value="first">
            <Text fz="sm">Posts</Text>
          </Tabs.Tab>

          <Tabs.Tab value="second">
            <Text fz="sm">NFTs</Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first">
        {isLoadingPosts ? (
  <>
    <Space h="md"/>
    <Center>
      <Loader variant="bars" />
    </Center>
  </>
) : (
  posts && posts.length > 0 ? (
    posts.map((post) => (
      <Post post={post} username={userName} key={post.PostHashHex}/>
    ))
  ) : (
    // If no NFTs, show the Badge
    <>
      <Space h="md"/>
      <Center>
        <Badge
          size="md"
          radius="sm"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan", deg: 45 }}
        >
          Post something to view them here!
        </Badge>
      </Center>
    </>
  )
)}

                   <Space h={222} />

        </Tabs.Panel>
        
        <Tabs.Panel value="second">
        {isLoadingNFTs ? (
  <>
    <Space h="md"/>
    <Center>
      <Loader variant="bars" />
    </Center>
  </>
) : (
  // After loading, check if there are NFTs to display
  NFTs && Object.keys(NFTs).length > 0 ? (
    Object.keys(NFTs).map((key, index) => {
      const nft = NFTs[key];
      return (
        <Post post={nft.PostEntryResponse} username={nft.PostEntryResponse.ProfileEntryResponse.Username} key={nft.PostEntryResponse.PostHashHex}/>
      );
    })
  ) : (
    // If no NFTs, show the Badge
    <>
      <Space h="md"/>
      <Center>
        <Badge
          size="md"
          radius="sm"
          variant="gradient"
          gradient={{ from: "indigo", to: "cyan", deg: 45 }}
        >
          Mint something to view them here!
        </Badge>
      </Center>
    </>
  )
)}
        
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} size="auto" centered>
        <Image src={selectedImage} radius="md" alt="post-image" fit="contain" />
      </Modal>
    </>
  );
};